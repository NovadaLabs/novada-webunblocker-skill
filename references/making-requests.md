# Making Requests

Endpoint:

```text
POST https://webunlocker.novada.com/request
```

Headers:

- `Authorization: Bearer <API_KEY>`
- `Content-Type: application/x-www-form-urlencoded`

Example:

```bash
curl -X POST https://webunlocker.novada.com/request \
 -H "Authorization: Bearer API_KEY" \
 -H "Content-Type: application/x-www-form-urlencoded" \
 -d "target_url=https://www.google.com" \
 -d "response_format=html" \
 -d "js_render=True"
```
