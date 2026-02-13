## Extra Long Blooms

The core problem here is that the backend does no validation on bloom length before saving. Checks are only done in the frontend.

### Reasonable solutions

1. Add validation in `backend/endpoints.py` `send_bloom` to check message length and reject if too long. Ideally this should reject using the same `jsonify({"success": False, "message": "..."}), 400` as other endpoints use, not just by throwing an exception (which will render poorly).
2. Adding validation to `backend/data/blooms.py` `add_bloom`. Ideally this would probably raise a `ValueError` which is handled in the endpoint and converted to a clear error response (as described in 1).

### Optional nice to sees

1. A test showing the behaviour is fixed (encouraged!).
2. Some kind of migration to handle existing too-long blooms (either to delete or truncate).
3. A constraint in the database limiting the length of bloom content.

### Problems to look out for

1. Just raising an exception, rather than returning structured JSON errors.
2. Repeating the max bloom length both in the `if`-guard and the error message - ideally this would be an extracted constant.
3. Changes to the frontend - there may be some niceties people can improve, but this problem only _needs_ a backend change.

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.
