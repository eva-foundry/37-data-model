@echo off
curl "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent-summary" -o summary-output.txt --silent --max-time 10
type summary-output.txt
