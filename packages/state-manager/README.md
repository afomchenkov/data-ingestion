# State Manager

State Transitions:

```txt
OFF → ACTIVE (via ACTIVATE)
ACTIVE → SUSPENDED (via SUSPEND)
SUSPENDED → ACTIVE (via RESUME)
ACTIVE → EXPIRED (via EXPIRE)
EXPIRED → ACTIVE (via ACTIVATE - renew)
```
