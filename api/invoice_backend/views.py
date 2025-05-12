from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from .models import Invoice, Setting, UserProfile
from .models import Statement, Deposit
from .models import CompanyBill, Buyer, Salary, Other,BankingDeposit
from .serializers import InvoiceSerializer, SettingSerializer, StatementSerializer, DepositSerializer,CompanyBillSerializer, BuyerSerializer, SalarySerializer, OtherSerializer,BankingDepositSerializer,UserProfileSerializer
from django.contrib.auth.models import User
from datetime import datetime
from django.http import JsonResponse
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import FileResponse,Http404
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import get_template
import os
import json
import io
from xhtml2pdf import pisa
import traceback
from django.http import HttpResponseBadRequest
from django.core.files.storage import default_storage

# ========================
# 📦 Invoice APIs
# ========================


class StatementListAPIView(generics.ListAPIView):
    serializer_class = StatementSerializer

    def get_queryset(self):
        invoice_id = self.kwargs['invoice_id']
        return Statement.objects.filter(invoice_id=invoice_id)


class DepositListAPIView(generics.ListAPIView):
    serializer_class = DepositSerializer

    def get_queryset(self):
        statement_id = self.kwargs['statement_id']
        return Deposit.objects.filter(statement_id=statement_id) 
    


def download_invoice_pdf(request, invoice_id):
    try:
        invoice = Invoice.objects.get(pk=invoice_id)
        template = get_template("invoice_template.html")
        html = template.render({"invoice": invoice})

        print("Generated HTML:")
        print(html)

        buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=buffer)

        if pisa_status.err:
            return HttpResponse("We had some errors <pre>" + html + "</pre>", status=500)

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice_id}.pdf"'
        return response
    
    except Invoice.DoesNotExist:
        return HttpResponse(f'Invoice with ID {invoice_id} not found', status=404)
    except Exception as e:
        print("Unexpected Error in download_invoice_pdf:", str(e))
        print(traceback.format_exc())
        return HttpResponse(f'Error: {str(e)}', status=500)




def get_next_invoice_number():
    current_year = datetime.now().year
    next_year = current_year + 1
    financial_year = f"{current_year}/{next_year}"
    
    # Get all invoices for the current financial year
    invoices = Invoice.objects.filter(financial_year=financial_year)
    
    if invoices.exists():
        # Extract numbers and find the maximum
        numbers = []
        for invoice in invoices:
            try:
                num_part = invoice.invoice_number.split('-')[0]
                numbers.append(int(num_part))
            except (ValueError, IndexError):
                continue
        
        if numbers:
            max_num = max(numbers)
            next_num = max_num + 1
        else:
            next_num = 1
    else:
        next_num = 1
    
    return f"{next_num:02d}-{financial_year}", financial_year

@api_view(['GET'])
def get_latest_invoice_number(request):
    latest_invoice = Invoice.objects.order_by('-id').first()
    if latest_invoice:
        next_invoice_number = latest_invoice.invoice_number + 1
    else:
        next_invoice_number = 1
    return Response({'next_invoice_number': next_invoice_number})

@csrf_exempt
def get_invoices_by_buyer(request):
    buyer_name = request.GET.get("name", "")
    invoices = Invoice.objects.filter(buyer_name__iexact=buyer_name)
    data = list(invoices.values())
    return JsonResponse(data, safe=False)

@api_view(['GET'])
def get_invoices(request):
    year_range = request.query_params.get('year', None)
    if year_range:
        invoices = Invoice.objects.filter(financial_year=year_range)
    else:
        invoices = Invoice.objects.all()

    serializer = InvoiceSerializer(invoices, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_invoice(request):
    data = request.data.copy()
    
    try:
        # Generate invoice number if not provided
        if not data.get("invoice_number"):
            invoice_number, financial_year = get_next_invoice_number()
            data['invoice_number'] = invoice_number
            data['financial_year'] = financial_year

        serializer = InvoiceSerializer(data=data)
        if serializer.is_valid():
            invoice = serializer.save()

             # Update the last_invoice_number in the settings after creating the invoice
            setting = Setting.objects.first()
            if setting:
                setting.last_invoice_number = int(invoice.invoice_number.split('-')[0])
                setting.save()


            return Response({
                "status": "success",
                "message": "Invoice saved successfully",
                "data": serializer.data,
                "next_invoice_number": get_next_invoice_number()[0]
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def get_next_available_number(request):
    try:
        next_number, financial_year = get_next_invoice_number()
        return Response({
            "invoice_number": next_number,
            "financial_year": financial_year
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    
@api_view(['GET', 'PUT', 'DELETE'])
def invoice_detail(request, pk):
    try:
        invoice = Invoice.objects.get(pk=pk)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = InvoiceSerializer(invoice, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        invoice.delete()
        return Response({'message': 'Invoice deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# ✅ NEW - Class-based detail view for React use
class InvoiceDetailView(generics.RetrieveAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

# ========================
# ⚙ Setting APIs
# ========================

@api_view(['GET', 'POST'])
def settings_list_create(request):
    if request.method == 'GET':
        settings = Setting.objects.all()
        serializer = SettingSerializer(settings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        existing_setting = Setting.objects.first()
        if existing_setting:
            serializer = SettingSerializer(existing_setting, data=request.data)
        else:
            serializer = SettingSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if existing_setting else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_setting(request, pk):
    try:
        setting = Setting.objects.get(pk=pk)
    except Setting.DoesNotExist:
        return Response({'error': 'Setting not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SettingSerializer(setting, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_setting(request, pk):
    try:
        setting = Setting.objects.get(pk=pk)
    except Setting.DoesNotExist:
        return Response({'error': 'Setting not found'}, status=status.HTTP_404_NOT_FOUND)

    setting.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# ========================
# 👤 User Signup API
# ========================

@api_view(['POST'])
def signup_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.save()
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)



def get_next_invoice_number():
    current_year = datetime.now().year
    next_year = current_year + 1
    financial_year = f"{current_year}/{next_year}"

    # Get all invoices for the current financial year
    invoices = Invoice.objects.filter(financial_year=financial_year)

    if invoices.exists():
        # Extract numbers and find the maximum
        numbers = []
        for invoice in invoices:
            try:
                num_part = invoice.invoice_number.split('-')[0]
                numbers.append(int(num_part))
            except (ValueError, IndexError):
                continue
        
        if numbers:
            max_num = max(numbers)
            next_num = max_num + 1
        else:
            next_num = 1
    else:
        next_num = 1
    
    return f"{next_num:02d}-{financial_year}", financial_year




# ========================
# 👥 Banking Transaction APIs
# ========================

# Function to create a Company Transaction

@api_view(['POST', 'GET'])
def create_company_transaction(request):
    if request.method == 'POST':
        serializer = CompanyBillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'GET':
        transactions = CompanyBill.objects.all()
        serializer = CompanyBillSerializer(transactions, many=True)
        return Response(serializer.data)


# Function to retrieve an individual Company Transaction
@api_view(['GET', 'DELETE'])
def company_transaction_detail(request, pk):
    try:
        transaction = CompanyBill.objects.get(pk=pk)
    except CompanyBill.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CompanyBillSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response({"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)



# Function to create a Buyer Transaction
@api_view(['POST', 'GET'])
def create_buyer_transaction(request):
    try:
        if request.method == 'POST':
            data = request.data.copy()

            print("🔍 Raw incoming request.data:", request.data)
            print("🛠️  Copied data before processing:", data)

            data['transaction_date'] = data.pop('selected_date', data.get('transaction_date'))
            data['invoice_id'] = data.pop('invoice', data.get('invoice_id'))

            print("✅ Final data passed to serializer:", data)

            serializer = BuyerSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'GET':
            transactions = Buyer.objects.all()
            serializer = BuyerSerializer(transactions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Function to retrieve an individual Buyer Transaction
@api_view(['GET', 'DELETE'])
def buyer_transaction_detail(request, pk):
    try:
        transaction = Buyer.objects.get(pk=pk)
    except Buyer.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BuyerSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response({"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)



# Function to create a Salary Transaction
@api_view(['POST', 'GET'])
def create_salary_transaction(request):
    if request.method == 'POST':
        serializer = SalarySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
      # GET method to list all salary transactions
    elif request.method == 'GET':
        salary_transactions = Salary.objects.all()
        serializer = SalarySerializer(salary_transactions, many=True)
        return Response(serializer.data)
    
# Function to retrieve an individual Salary Transaction
@api_view(['GET', 'DELETE'])
def salary_transaction_detail(request, pk):
    try:
        transaction = Salary.objects.get(pk=pk)
    except Salary.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SalarySerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response({"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# Function to create an Other Transaction
@api_view(['POST', 'GET'])
def create_other_transaction(request):
    if request.method == 'POST':
        # Handle POST request for creating a new other transaction
        serializer = OtherSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle GET request to list all other transactions
    elif request.method == 'GET':
        other_transactions = Other.objects.all()
        serializer = OtherSerializer(other_transactions, many=True)
        return Response(serializer.data)


# Function to retrieve an individual Other Transaction
@api_view(['GET', 'DELETE'])
def other_transaction_detail(request, pk):
    try:
        transaction = Other.objects.get(pk=pk)
    except Other.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = OtherSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response({"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
@api_view(['GET', 'POST'])
def add_bankingdeposit(request):
    if request.method == 'POST':
        # Handling POST request (create a new deposit)
        serializer = BankingDepositSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'GET':
        # Handling GET request (fetch all deposits)
        deposits = BankingDeposit.objects.all()
        serializer = BankingDepositSerializer(deposits, many=True)
        return Response(serializer.data)

# for profile page 


class UserProfileCreateView(generics.CreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile