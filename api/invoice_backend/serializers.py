from rest_framework import serializers
from .models import Invoice
from .models import Setting,Statement, Deposit
from .models import CompanyBill, Buyer, Salary, Other,BankingDeposit
from .models import UserProfile
from django.contrib.auth.models import User


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = '__all__' 

class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ['id', 'deposit_date', 'amount']


class StatementSerializer(serializers.ModelSerializer):
    deposits = DepositSerializer(many=True, read_only=True)
    total_deposited = serializers.FloatField(read_only=True)
    remaining_balance = serializers.FloatField(read_only=True)
    

    class Meta:
        model = Statement
        fields = '__all__'

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


class BankingDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankingDeposit  # or your model name
        fields = '__all__'









# for profile page 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create_user(**user_data)
        profile = UserProfile.objects.create(user=user, **validated_data)
        return profile