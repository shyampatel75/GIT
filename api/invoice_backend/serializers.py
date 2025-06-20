from rest_framework import serializers
from .models import Invoice
from .models import Setting,Deposit
from .models import CompanyBill, Buyer, Salary, Other,BankingDeposit,Employee,BankAccount,CashEntry
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile
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
            'hsn_sac_code': {'required': True},
        }

    def validate(self, data):
        # Custom validation for required fields
        required_fields = ['buyer_name', 'buyer_address', 'invoice_date']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: "This field is required."})
        
        # Validate that either (rate and hours) or base_amount is provided
        if not data.get('base_amount') and not (data.get('rate') and data.get('total_hours')):
            raise serializers.ValidationError(
                "Either provide rate and hours, or directly enter the base amount"
            )
        
        if data.get('country') == 'India' and not data.get('state'):
            raise serializers.ValidationError(
                {"state": "State is required for Indian invoices"}
            )
        if not data.get('hsn_sac_code'):
            raise serializers.ValidationError(
                {"hsn_sac_code": "HSN/SAC code is required"}
            )    
        
        return data

class SettingSerializer(serializers.ModelSerializer):
    HSN_codes = serializers.JSONField(required=False)
    
    class Meta:
        model = Setting
        fields = '__all__'
        extra_kwargs = {
            'HSN_codes': {'required': False},
        }

    def validate_HSN_codes(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("HSN_codes must be a list")
        return value

class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ['id', 'deposit_date', 'amount']

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
        extra_kwargs = {
            'other_amount': {'required': True},
            'transaction_type': {'required': True},
            'payment_method': {'required': False},
            'bank_name': {'required': False}
        }

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


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

class CashEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CashEntry
        fields = ['id', 'amount', 'description', 'date', 'is_deleted']