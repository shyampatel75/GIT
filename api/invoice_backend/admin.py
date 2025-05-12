from django.contrib import admin
from .models import Invoice,Setting,Statement, Deposit,Buyer, CompanyBill, Salary, Other,BankingDeposit


# Register your models here.

admin.site.register(Invoice)
admin.site.register(Setting)
admin.site.register(Statement)
admin.site.register(Deposit)
admin.site.register(Buyer)
admin.site.register(CompanyBill)
admin.site.register(Salary)
admin.site.register(Other)
admin.site.register(BankingDeposit)