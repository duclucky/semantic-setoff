$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
$env:GENVM_VERSION = "v0.2.16"

$contract = "contracts\semantic_setoff.py"
$bytes = [System.IO.File]::ReadAllBytes($contract)
if (($bytes | Where-Object { $_ -gt 127 }).Count -ne 0) {
    throw "CONTRACT_ASCII_FAIL"
}
if ((Get-Content $contract -TotalCount 1) -ne '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }') {
    throw "CONTRACT_HEADER_FAIL"
}
if ((Select-String -Path $contract -Pattern "class SemanticSetoff\(gl\.Contract\):").Count -ne 1) {
    throw "CONTRACT_CLASS_COUNT_FAIL"
}
Write-Output "CONTRACT_SOURCE_OK ASCII_HEADER_SINGLE_CLASS"

& .\.venv\Scripts\genvm-lint.exe check $contract
if ($LASTEXITCODE -ne 0) { throw "GENVM_LINT_FAIL" }

& .\.venv\Scripts\pytest.exe -q tests\direct
if ($LASTEXITCODE -ne 0) { throw "DIRECT_TEST_FAIL" }

Push-Location frontend
try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw "FRONTEND_TEST_FAIL" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "FRONTEND_BUILD_FAIL" }
}
finally {
    Pop-Location
}

Write-Output "PROJECT_CHECK_OK"
