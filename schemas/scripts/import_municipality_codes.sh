CODELIST=$(curl -s https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes/kunta_1_20210101/codes/?array)

echo '{"$id":"municipality_code.json","type":"enum","enum":'"$CODELIST"',"description":"Municipality as a code defined in koodistot.suomi.fi."}' > "`dirname $0`"/../municipality_code.json
