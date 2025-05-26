# settings_app/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import Setting

@receiver(post_migrate)
def create_default_settings(sender, **kwargs):
    if Setting.objects.count() == 0:
        Setting.objects.create(
            company_name="Your Company",
            seller_address="Your Address",
            seller_email="your@email.com",
            seller_pan="ABCDE1234F",
            seller_gstin="22AAAAA0000A1Z5",
            bank_account_holder="Your Company",
            bank_name="Bank Name",
            account_number="123456789012",
            ifsc_code="BANK0001234",
            branch="Main Branch",
            swift_code="SWFT0001",
            last_invoice_number=0
        )
        print("Default settings created!")