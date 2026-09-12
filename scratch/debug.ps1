$file = "c:\Users\Tom Pc\Desktop\Commissions\LibraSmart\src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file)
Write-Output "Line 3551: [$($lines[3550])]"
