from django.db import models
from django.utils import timezone
from datetime import date
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.contrib.auth import get_user_model


class CustomUserManager(BaseUserManager):
    def create_user(self, email, first_name, mobile, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            mobile=mobile,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, mobile, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, first_name, mobile, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'mobile']

    def __str__(self):
        return self.email




class Invoice(models.Model):
    # Buyer Info (required fields)
    buyer_name = models.CharField(max_length=255)
    buyer_address = models.TextField()
    buyer_gst = models.CharField(max_length=20)
    
    # Consignee Info (optional)
    consignee_name = models.CharField(max_length=255, blank=True, null=True)
    consignee_address = models.TextField(blank=True, null=True)
    consignee_gst = models.CharField(max_length=20, blank=True, null=True)

    # Invoice details (date is required)
    financial_year = models.CharField(max_length=9, default='2025-2026')
    invoice_number = models.CharField(max_length=20, default="01-2025/2026")
    invoice_date = models.DateField()
    
    # Optional fields
    delivery_note = models.CharField(max_length=255, blank=True, null=True,default='')
    payment_mode = models.CharField(max_length=100, blank=True, null=True,default='')
    delivery_note_date = models.DateField(blank=True, null=True)
    destination = models.CharField(max_length=255, blank=True, null=True,default='')
    Terms_to_delivery = models.CharField(max_length=255, blank=True, null=True,default='')
    
    # Country and Currency Info
    country = models.CharField(max_length=255, default='India')
    currency = models.CharField(max_length=10, default='INR')

    # Product details
    Particulars = models.CharField(max_length=255, blank=True, null=True,default='Consultancy')
    hsn_code = models.CharField(max_length=10, blank=True, null=True,default='0000')
    total_hours = models.FloatField(blank=True, null=True, default=0.0)
    rate = models.FloatField(blank=True, null=True, default=0.0)
    base_amount = models.FloatField()

    # Tax details
    cgst = models.FloatField(blank=True, null=True, default=0.0)
    sgst = models.FloatField(blank=True, null=True, default=0.0)
    total_with_gst = models.FloatField()
    amount_in_words = models.CharField(max_length=255, blank=True, null=True)
    taxtotal = models.FloatField(blank=True, null=True, default=0.0)

    # Remarks
    remark = models.TextField(blank=True, null=True,default='')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.invoice_number

    def save(self, *args, **kwargs):
        # Calculate totals before saving
        if not self.base_amount:
            if self.total_hours and self.rate:
                self.base_amount = self.total_hours * self.rate
        
        if self.country == 'India' and self.base_amount:
            self.cgst = (self.base_amount * 9) / 100
            self.sgst = (self.base_amount * 9) / 100
            self.taxtotal = self.cgst + self.sgst
            self.total_with_gst = self.base_amount + self.taxtotal
        else:
            self.cgst = 0
            self.sgst = 0
            self.taxtotal = 0
            self.total_with_gst = self.base_amount
        
        super().save(*args, **kwargs)


class Setting(models.Model):
    # Seller Info
    company_name = models.CharField(max_length=255, default='Unknown')
    seller_address = models.TextField(default='Not Provided')
    seller_email = models.EmailField(default='noemail@example.com')
    seller_pan = models.CharField(max_length=20, default='UNKNOWN')
    seller_gstin = models.CharField(max_length=20, default='UNKNOWN')

    # Company Bank Details
    bank_account_holder = models.CharField(max_length=255, default='Company Account')
    bank_name = models.CharField(max_length=255, default='XYZ Bank')
    account_number = models.CharField(max_length=50, default='000000000000')
    ifsc_code = models.CharField(max_length=20, default='XYZB0000000')
    branch = models.CharField(max_length=255, default='Main Branch')
    swift_code = models.CharField(max_length=20, default='XYZ000')

    # Company Logo
    logo = models.ImageField(upload_to='', null=True, blank=True)
    last_invoice_number = models.IntegerField(default=0)


    # Link to user who owns these settings
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.company_name} - Settings"



class Statement(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='statements')
    date = models.DateField(default=timezone.now)
    notice = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Statement ({self.date}) - Invoice {self.invoice.invoice_number}"

    @property
    def total_deposited(self):
        return sum(deposit.amount for deposit in self.deposits.all())

    @property
    def remaining_balance(self):
        return self.amount - self.total_deposited


class Deposit(models.Model):
    statement = models.ForeignKey(Statement, on_delete=models.CASCADE, related_name='deposits')
    deposit_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"₹{self.amount} on {self.deposit_date} for Statement {self.statement.id}"

class Buyer(models.Model):
    buyer_name = models.CharField(max_length=255, null=True, blank=True) 
    invoice_id = models.CharField(max_length=50, null=True, blank=True)
    transaction_date = models.DateField(null=True, blank=True)  # Temporary
    notice = models.CharField(max_length=255, null=False, default="")
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.buyer_name} - {self.invoice_id or 'No Invoice'}"


class CompanyBill(models.Model):
    company_name = models.CharField(max_length=255, default='Unknown')
    transaction_date = models.DateField(default=timezone.now)  # Changed from selected_date
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notice = models.TextField(default="No remarks")

    def __str__(self):
        return self.company_name



class Salary(models.Model):
    salary_newname = models.CharField(max_length=100, default="N/A")
    salary_name = models.CharField(max_length=255)
    salary_amount = models.DecimalField(max_digits=10, decimal_places=2)
    salary_date = models.DateField()

    def __str__(self):
        return f"{self.salary_name} Salary"


class Other(models.Model):
    TYPE_CHOICES = [
        ('Fast Expand', 'Fast Expand'),
        ('Profit', 'Profit'),
        ('Other', 'Other'),
    ]
    
    other_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='Other'
    )
    other_date = models.DateField()
    other_notice = models.TextField()
    other_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def ___str_(self):
        return f"Other transaction on {self.other_date}"

class BankingDeposit(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"{self.amount} on {self.date}"

class Employee(models.Model):
    name = models.CharField(max_length=100)
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    email = models.EmailField()
    number = models.CharField(max_length=15)
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Employee"
        verbose_name_plural = "Employees"


User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    image1 = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    image2 = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email}"
    
class RemainingAmount(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Remaining Amount: {self.amount}"