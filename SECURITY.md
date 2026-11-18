# Security policy

Security reports are accepted for the current `main` branch and its public deployment. Use GitHub’s private vulnerability reporting if available. If the option is unavailable, use a private channel with a repository maintainer before sharing details. [GitHub reporting guide](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)

Include the affected component or URL, expected and observed behavior, impact, and the minimum steps needed to reproduce the issue. Redact credentials, operational records, and private location data. Use a local instance and your own test data when validating a finding.

## Data and credentials

- The workspace uses browser storage. People with access to the same browser profile can access its saved workspace.
- Keep wallet keys and `LOCAL_FORECAST_TOKEN` in local or server-side configuration. Use a dedicated Sepolia test wallet.
- The forecast endpoint requires a configured access token. The x402 client restricts payment to the configured Sepolia asset and applies a per-payment cap. The one-attempt guard is scoped to a process.
- Check settlement before repeating a paid request after a timeout.
