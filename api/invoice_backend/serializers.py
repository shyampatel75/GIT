from rest_framework import serializers
from .models import Invoice
from .models import Setting,Deposit
from .models import CompanyBill, Buyer, Salary, Other,BankingDeposit,Employee
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile, RemainingAmount
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()    #Django's built-in User model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'mobile')

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)    
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'})
    mobile = serializers.CharField(required=True, max_length=10)
    tokens = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'mobile', 'password', 'password2', 'tokens')

    def get_tokens(self, obj):
        user = User.objects.get(email=obj.email)
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        
        if len(attrs['mobile']) != 10:
            raise serializers.ValidationError(
                {"mobile": "Mobile number must be 10 digits"})
                
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class InvoiceSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Invoice
        fields = '__all__'
        extra_kwargs = {
            'buyer_name': {'required': True},
            'buyer_address': {'required': True},
            'buyer_gst': {'required': True},
            
        }

    def validate(self, data):
        # Custom validation for required fields
        required_fields = ['buyer_name', 'buyer_address', 'buyer_gst', 'invoice_date']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: "This field is required."})
        
        # Validate that either (rate and hours) or base_amount is provided
        if not data.get('base_amount') and not (data.get('rate') and data.get('total_hours')):
            raise serializers.ValidationError(
                "Either provide rate and hours, or directly enter the base amount"
            )
        
        return data

class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = '__all__' 

class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ['id', 'deposit_date', 'amount']


# class StatementSerializer(serializers.ModelSerializer):
#     deposits = DepositSerializer(many=True, read_only=True)
#     total_deposited = serializers.FloatField(read_only=True)
#     remaining_balance = serializers.FloatField(read_only=True)
    

#     class Meta:
#         model = Statement
#         fields = '__all__'

class CompanyBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBill
        fields = '__all__'

class BuyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buyer
        fields = '__all__'

class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = '__all__'

class OtherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Other
        fields = '__all__'
        extra_kwargs = {
            'other_amount': {'required': True},
            'transaction_type': {'required': True}
        }


class BankingDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankingDeposit  
        fields = '__all__'

class RemainingAmountSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    buyer_name = serializers.CharField(source='invoice.buyer_name', read_only=True)
    buyer_gst = serializers.CharField(source='invoice.buyer_gst', read_only=True)
    
    class Meta:
        model = RemainingAmount
        fields = ['id', 'amount', 'invoice_number', 'buyer_name', 'buyer_gst']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    image1_url = serializers.SerializerMethodField()
    image2_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'image1', 'image2', 'image1_url', 'image2_url', 'created_at', 'updated_at']
        extra_kwargs = {
            'image1': {'write_only': True},
            'image2': {'write_only': True}
        }

    def get_image1_url(self, obj):
        if obj.image1:
            return self.context['request'].build_absolute_uri(obj.image1.url)
        return None

    def get_image2_url(self, obj):
        if obj.image2:
            return self.context['request'].build_absolute_uri(obj.image2.url)
        return None