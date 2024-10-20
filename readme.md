## Keys

- UserKey
  - Encrypts and decrypts data with a password
  - Can be derived from a password
  - Can be derived from a password and a salt
  - Can be derived from a JSON Web Key
  - Can be exported as JSON Web Key
- WorkspaceKey
  - Encrypts and decrypts data with a generatey key
  - Can be derived from a JSON Web Key which is wrapped from a UserKey   
  - Can be exported as JSON Web Key which is wrapped from a UserKey


To share a workspace key with another user, you can create a new UserKey with a special password which is used to encrypt the workspace key. The UserKey can then be exported as JSON Web Key which can be shared with the other user.
