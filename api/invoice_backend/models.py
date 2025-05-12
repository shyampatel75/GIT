# bills/models.py

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import date


class Invoice(models.Model):

    # Buyer Info
    buyer_name = models.CharField(max_length=255, default='Unknown')
    buyer_address = models.TextField(default='Not Provided')
    buyer_gst = models.CharField(max_length=20, default='UNKNOWN')


    # Consignee Info
    consignee_name = models.CharField(max_length=255, default='Unknown')
    consignee_address = models.TextField(default='Not Provided')
    consignee_gst = models.CharField(max_length=20, default='UNKNOWN')

    # Invoice details
    financial_year = models.CharField(max_length=9, default='2025-2026')  # E.g., "2025-2026"

    invoice_number = models.CharField(max_length=20, default="01-2025/2026")

    invoice_date = models.DateField(default=timezone.now)
    delivery_note = models.CharField(max_length=255, default='Not Provided')
    payment_mode = models.CharField(max_length=100, default='Cash')
    delivery_note_date = models.DateField(default=timezone.now)
    destination = models.CharField(max_length=255, default='Not Provided')
    Terms_to_delivery = models.CharField(max_length=255, default='Not Provided')
    
    # Country and Currency Info
    country = models.CharField(max_length=255, default='India')
    currency = models.CharField(max_length=10, default='INR')

    # Product details
    Particulars = models.CharField(max_length=255, default='Consultancy')
    hsn_code = models.CharField(max_length=10, default='0000')
    total_hours = models.FloatField(default=0.0)
    rate = models.FloatField(default=0.0)
    base_amount = models.FloatField(default=0.0)

    # Tax details
    cgst = models.FloatField(default=0.0)
    sgst = models.FloatField(default=0.0)
    total_with_gst = models.FloatField(default=0.0)
    amount_in_words = models.CharField(max_length=255, blank=True)
    taxtotal = models.FloatField(default=0.0)

    # Remarks
    remark = models.TextField(default='No remarks')

    # Created at timestamp
    created_at = models.DateTimeField(default=timezone.now)

    def _str_(self):
        return self.invoice_number



class Setting(models.Model):
    # Seller Info
    seller_name = models.CharField(max_length=255, default='Unknown')
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

    def _str_(self):
        return f"{self.seller_name} - Settings"


class Statement(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='statements')
    date = models.DateField(default=timezone.now)
    notice = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def _str_(self):
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

    def _str_(self):
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

    def _str_(self):
        return f"{self.salary_name} Salary"


class Other(models.Model):
    other_date = models.DateField()
    other_notice = models.TextField()
    other_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def _str_(self):
        return f"Other transaction on {self.other_date}"

# for profile page 

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15)
    profile_picture1 = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    profile_picture2 = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _str_(self):
        return self.name

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'




class BankingDeposit(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"{self.amount} on {self.date}"