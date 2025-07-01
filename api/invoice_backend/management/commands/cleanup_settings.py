from django.core.management.base import BaseCommand
from invoice_backend.models import Setting

class Command(BaseCommand):
    help = 'Clean up settings by removing default values from company_name and seller_address'

    def handle(self, *args, **options):
        # Find all settings with default values
        settings_to_update = Setting.objects.filter(
            company_name__in=['Your Company', 'Unknown']).update(company_name='')
        
        settings_to_update_address = Setting.objects.filter(
            seller_address__in=['Your Address', 'Not Provided']).update(seller_address='')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleaned up {settings_to_update} settings with default company names and {settings_to_update_address} settings with default addresses'
            )
        ) 