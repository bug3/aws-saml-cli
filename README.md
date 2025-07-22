# aws-saml-cli

CLI tool for SAML-based AWS authentication via your Identity Provider (IdP).  
Securely saves your login session, captures the SAML response, parses the assertion, and assumes your AWS role with STS.

## Features

- Interactive login via browser
- Saves session state encrypted with [uniquenv](https://github.com/bug3/uniquenv)
- Intercepts SAML response and extracts role information
- Assumes AWS role and writes credentials to `~/.aws/credentials`
- Optional AWS region override via `--region`

---

## Installation

```bash
npm install -g aws-saml-cli
```

> Installs the CLI globally as the `aws-saml-cli` command.

---

## Usage

### Save SAML session

```bash
aws-saml-cli save-session "<saml-login-url>"
```

- Opens a browser to the given SAML login URL
- Login manually and press F8 or the Resume button in the browser
- Encrypted session is saved to `~/.aws-saml-cli/session.uniquenv`

---

### Capture SAML and assume AWS role

```bash
aws-saml-cli capture [--region <aws-region>]
```

- Loads the encrypted session
- Navigates to the previously stored login URL
- Intercepts the SAML `POST` request
- Parses the `SAMLResponse`, extracts the role and principal ARNs
- Sends `AssumeRoleWithSAML` to STS
- Writes credentials to `~/.aws/credentials` under `[default]`

---

## Configuration

- Region can be provided via `--region`, otherwise resolved via:
  - `AWS_REGION` or `AWS_DEFAULT_REGION` environment variable
  - `~/.aws/config` profile

---

## Example Workflow

```bash
aws-saml save-session "https://your-idp.example.com/sso/initiate"
```

```bash
aws-saml capture --region eu-west-1
```

```bash
aws sts get-caller-identity
```

---

## Session File

Session is stored at:

```
~/.aws-saml-cli/session.uniquenv
```

Encrypted using your device-specific key with [uniquenv](https://github.com/bug3/uniquenv). Cannot be decrypted on other machines.

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
