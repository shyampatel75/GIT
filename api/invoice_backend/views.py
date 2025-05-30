from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from .models import Invoice, Setting, Deposit,CompanyBill, Buyer, Salary, Other,BankingDeposit,Employee,Bank
from .serializers import InvoiceSerializer,SettingSerializer, DepositSerializer,CompanyBillSerializer, BuyerSerializer, SalarySerializer, OtherSerializer,BankingDepositSerializer,EmployeeSerializer,RemainingAmountSerializer,UserProfile,RemainingAmount
from django.contrib.auth.models import User
from datetime import datetime
from django.http import JsonResponse,FileResponse,Http404,HttpResponseBadRequest
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.template.loader import get_template
import io
from xhtml2pdf import pisa
import traceback
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserProfileSerializer



class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ========================
# Authentication APIs (Function-Based)
# ========================

@api_view(['POST'])
@permission_classes([AllowAny])   #open to unauthenticated users
def register_user(request):
    try:
        serializer = RegisterSerializer(data=request.data) #Validates input data using your custom RegisterSerializer
        if serializer.is_valid():
            user = serializer.save() #If data is valid, creates a new User
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': 'User created and logged in successfully'
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    serializer = MyTokenObtainPairSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })
    except Exception as e:
        print(f"Login error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    
  
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def logout_user(request):
#     try:
#         refresh_token = request.data.get('refresh')
#         token = RefreshToken(refresh_token)
#         token.blacklist()
#         return Response({'message': 'Logout successful'})
#     except Exception as e:
#         return Response(
#             {'error': 'Invalid token'}, 
#             status=status.HTTP_400_BAD_REQUEST
#         )
      
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# ========================
# 📦 Invoice APIs
# ========================

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def statement_list(request, invoice_id):
#     statements = Statement.objects.filter(invoice_id=invoice_id, invoice__user=request.user)
#     serializer = StatementSerializer(statements, many=True)
#     return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deposit_list(request, statement_id):
    deposits = Deposit.objects.filter(statement_id=statement_id, statement_invoice_user=request.user)
    serializer = DepositSerializer(deposits, many=True)
    return Response(serializer.data) 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoices(request):
    year_range = request.query_params.get('year', None)
    if year_range:
        invoices = Invoice.objects.filter(financial_year=year_range)
    else:
        invoices = Invoice.objects.all()

    serializer = InvoiceSerializer(invoices, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_invoice_number(request):
    current_year = datetime.now().year
    next_year = current_year + 1
    financial_year = f"{current_year}/{next_year}"

    # Get the highest invoice number for this financial year
    last_invoice = Invoice.objects.filter(
        financial_year=financial_year
    ).order_by('-invoice_number').first()
    
    if last_invoice:
        try:
            # Extract numeric part (handles formats like "100-2025/2026")
            num_part = last_invoice.invoice_number.split('-')[0]
            next_num = int(num_part) + 1
        except (ValueError, IndexError, AttributeError):
            next_num = 1
    else:
        next_num = 1
        
    invoice_number = f"{next_num:2d}-{financial_year}"
    
    return Response({
        'invoice_number': invoice_number,
        'financial_year': financial_year
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invoice(request):
    try:
        data = request.data.copy()
        
        # Remove invoice_number if present - let model generate it
        if 'invoice_number' in data:
            del data['invoice_number']
        
        serializer = InvoiceSerializer(data=data)
        
        if serializer.is_valid():
            # Let the model's save() handle the invoice number generation
            invoice = serializer.save()
            
            return Response({
                "status": "success",
                "invoice_number": invoice.invoice_number,
                "financial_year": invoice.financial_year,
                "data": serializer.data
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
       
# @api_view(['GET'])
# def get_next_available_number(request):
#     try:
#         next_number, financial_year = get_next_invoice_number()
#         return Response({
#             "invoice_number": next_number,
#             "financial_year": financial_year
#         })
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)
   
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
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

# @api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
# def settings_list_create(request):
#     if request.method == 'GET':
#         settings = Setting.objects.all()
#         serializer = SettingSerializer(settings, many=True)
#         return Response(serializer.data)

#     elif request.method == 'POST':
#         existing_setting = Setting.objects.first()
#         if existing_setting:
#             serializer = SettingSerializer(existing_setting, data=request.data)
#         else:
#             serializer = SettingSerializer(data=request.data)

#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_200_OK if existing_setting else status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
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

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def signup_user(request):
#     username = request.data.get('username')
#     email = request.data.get('email')
#     password = request.data.get('password')

#     if User.objects.filter(username=username).exists():
#         return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
#     if User.objects.filter(email=email).exists():
#         return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

#     user = User.objects.create_user(username=username, email=email, password=password)
#     user.save()

#     return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)



# ========================
# 👥 Banking Transaction APIs
# ========================

# Function to create a Company Transaction

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def create_company_transaction(request):
    if request.method == 'POST':
        serializer = CompanyBillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'GET':  # used to fetch all the data of company
        transactions = CompanyBill.objects.all()
        serializer = CompanyBillSerializer(transactions, many=True)
        return Response(serializer.data)


# Function to retrieve an individual Company Transaction
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def company_transaction_detail(request, pk):
    try:
        transaction = CompanyBill.objects.get(pk=pk)
    except CompanyBill.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET': # used to fetch perticular one data
        serializer = CompanyBillSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response({"detail": "Deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# Function to create a Buyer Transaction
@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def create_buyer_transaction(request):
    if request.method == 'POST':
        try:
            # Get data directly without renaming fields
            data = request.data.copy()
            
            # Ensure payment_method is provided
            if 'payment_method' not in data or not data['payment_method']:
                return Response(
                    {"payment_method": ["This field is required."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = BuyerSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    elif request.method == 'GET':
        transactions = Buyer.objects.all()
        serializer = BuyerSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# Function to retrieve an individual Buyer Transaction
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
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
    
# Add new endpoints for bank operations
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bank_list(request):
    if request.method == 'GET':
        banks = Bank.objects.all().order_by('name')
        bank_names = [bank.name for bank in banks]
        return Response(bank_names, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        bank_name = request.data.get('name', '').strip()
        if not bank_name:
            return Response({"error": "Bank name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            bank, created = Bank.objects.get_or_create(name=bank_name)
            if created:
                return Response({"name": bank.name}, status=status.HTTP_201_CREATED)
            return Response({"name": bank.name}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Function to create a Salary Transaction
@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
def create_other_transaction(request):
    if request.method == 'POST':
        data = request.data.copy()
        
        # Only require these fields
        required_fields = ['other_type', 'other_date', 'other_amount']
        if any(field not in data for field in required_fields):
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set default transaction_type if not provided
        if 'transaction_type' not in data:
            data['transaction_type'] = None
        
        serializer = OtherSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'GET':
        other_transactions = Other.objects.all().order_by('-other_date')
        serializer = OtherSerializer(other_transactions, many=True)
        return Response(serializer.data)

# Keep the detail view the same
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
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
        serializer = BankingDepositSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'GET':
        deposits = BankingDeposit.objects.all()
        serializer = BankingDepositSerializer(deposits, many=True)
        return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_create(request):
    if request.method == 'GET':
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = EmployeeSerializer(employee, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)  
    
     
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Delete old images if new ones are uploaded
            if 'image1' in request.FILES:
                if profile.image1:  # Check if there's an existing image
                    profile.image1.delete()  # Delete old image
                profile.image1 = request.FILES['image1']  # Assign new image
            
            if 'image2' in request.FILES:
                if profile.image2:
                    profile.image2.delete()
                profile.image2 = request.FILES['image2']
            
            # Save the profile with new images
            profile.save()
            
            # Serialize and return the updated profile
            serializer = UserProfileSerializer(profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'DELETE':
            # Clean up files before deleting profile
            if profile.image1:
                profile.image1.delete()
            if profile.image2:
                profile.image2.delete()
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# @api_view(['GET', 'POST', 'PATCH', 'PUT'])
# @permission_classes([IsAuthenticated])
# def remaining_amount_view(request):
#     # Get or create remaining amount record
#     remaining_amount, created = RemainingAmount.objects.get_or_create(user=request.user)
#     remaining_amount = RemainingAmount.objects.last()
#     if not remaining_amount:
#         remaining_amount = RemainingAmount.objects.create(amount=0.00)

#     if request.method == 'POST':
#         serializer = RemainingAmountSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     elif request.method in ['PATCH', 'PUT']:
#         # For PUT, we'll merge existing data with request data
#         if request.method == 'PUT':
#             data = {**RemainingAmountSerializer(remaining_amount).data, **request.data}
#         else:
#             data = request.data
            
#         serializer = RemainingAmountSerializer(
#             remaining_amount, 
#             data=data, 
#             partial=(request.method == 'PATCH')
#         )
        
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     elif request.method == 'GET':
#         serializer = RemainingAmountSerializer(remaining_amount)
#         return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_buyer_remaining_amount(request, buyer_gst):
    try:
        # Find invoices with this GST number
        invoices = Invoice.objects.filter(buyer_gst=buyer_gst)
        
        if not invoices.exists():
            return Response(
                {"detail": "No invoices found with this GST number"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get buyer name from first invoice (assuming same buyer for same GST)
        buyer_name = invoices.first().buyer_name
        
        # Find remaining amount - now using buyer_name instead of GST
        remaining_amount = RemainingAmount.objects.filter(
            buyer__buyer_name=buyer_name
        ).first()
        
        if not remaining_amount:
            return Response(
                {"detail": "No remaining amount record found for this buyer"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Serialize with both GST and buyer info
        response_data = {
            "buyer_name": buyer_name,
            "buyer_gst": buyer_gst,
            
            "amount": str(remaining_amount.amount),
            
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# List all or create new RemainingAmount
@api_view(['GET', 'POST'])
def remaining_amount_list(request):
    if request.method == 'GET':
        remaining_amounts = RemainingAmount.objects.all()
        serializer = RemainingAmountSerializer(remaining_amounts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = RemainingAmountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Retrieve, update, or delete a specific RemainingAmount by id (pk)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def remaining_amount_detail(request, pk):
    try:
        remaining_amount = RemainingAmount.objects.get(pk=pk)
    except RemainingAmount.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RemainingAmountSerializer(remaining_amount)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = RemainingAmountSerializer(remaining_amount, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        remaining_amount.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoices_by_gst(request, gst_number):
    try:
        invoices = Invoice.objects.filter(buyer_gst=gst_number)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def settings_list_create(request):
    if request.method == 'GET':
        # # Ensure at least one settings exists
        # if Setting.objects.count() == 0:
        #     Setting.objects.create_default_settings()
            
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



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_remaining_balances(request):
    try:
        # Get all invoices
        invoices = Invoice.objects.all()
        # Get all buyer transactions
        buyer_transactions = Buyer.objects.all()
        
        # Calculate totals per buyer
        buyer_totals = {}
        for txn in buyer_transactions:
            name = txn.buyer_name
            buyer_totals[name] = buyer_totals.get(name, 0) + float(txn.deposit_amount or 0)
        
        invoice_totals = {}
        for invoice in invoices:
            name = invoice.buyer_name
            invoice_totals[name] = invoice_totals.get(name, 0) + float(invoice.total_with_gst or 0)
        
        # Calculate remaining balances
        remaining_balances = {}
        all_buyers = set(list(buyer_totals.keys()) + list(invoice_totals.keys()))
        
        for buyer in all_buyers:
            remaining_balances[buyer] = invoice_totals.get(buyer, 0) - buyer_totals.get(buyer, 0)
        
        # Prepare response data
        response_data = [{
            'buyer_name': buyer,
            'total_invoiced': invoice_totals.get(buyer, 0),
            'total_paid': buyer_totals.get(buyer, 0),
            'remaining_balance': remaining_balances[buyer]
        } for buyer in all_buyers if remaining_balances[buyer] != 0]
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )