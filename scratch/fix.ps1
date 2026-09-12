$file = "c:\Users\Tom Pc\Desktop\Commissions\LibraSmart\src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)

$bad = '<span className={ adge }'
$good = '<span className={user.role === ''Administrator'' ? ''badge badge-warning'' : user.role === ''Librarian'' ? ''badge badge-info'' : user.role === ''Teacher'' ? ''badge badge-success'' : ''badge badge-secondary''}'

if ($content.Contains($bad)) {
    $content = $content.Replace($bad, $good)
    [System.IO.File]::WriteAllText($file, $content)
    Write-Output "REPLACED BAD BADGE CLASSNAME SUCCESSFULLY!"
} else {
    Write-Output "BAD STRING NOT FOUND"
}
