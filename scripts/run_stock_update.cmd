@echo off
cd /d "c:\Users\Lenovo\Desktop\Backup\Data Manu\Backup\PAGINA WEB"
python3 scripts\update_stock_cole43.py >> scripts\stock_update.log 2>&1
python3 scripts\update_stock_cole44.py >> scripts\stock_update.log 2>&1
