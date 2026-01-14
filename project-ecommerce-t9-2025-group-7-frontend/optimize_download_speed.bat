@echo off
echo ========================================
echo Tối ưu hóa tốc độ tải file Windows 11
echo ========================================
echo.
echo Chay file nay voi quyen Administrator!
echo.
pause

echo.
echo [1] Tang so luong ket noi TCP toi da...
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled
netsh int tcp set global netdma=enabled

echo.
echo [2] Tang kich thuoc receive window...
netsh int tcp set global autotuninglevel=normal

echo.
echo [3] Vo hieu hoa Windows Auto-Tuning (neu can)...
netsh int tcp set global autotuninglevel=disabled
echo (Neu cham hon, chay lai: netsh int tcp set global autotuninglevel=normal)

echo.
echo [4] Tang so luong ket noi dong thoi...
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v TcpNumConnections /t REG_DWORD /d 16777214 /f
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v MaxUserPort /t REG_DWORD /d 65534 /f
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v TcpTimedWaitDelay /t REG_DWORD /d 30 /f

echo.
echo [5] Tang kich thuoc receive buffer...
netsh int tcp set global autotuninglevel=experimental

echo.
echo [6] Kich hoat TCP Fast Open...
netsh int tcp set global fastopen=enabled

echo.
echo ========================================
echo Hoan thanh! Khoi dong lai may de ap dung.
echo ========================================
pause

