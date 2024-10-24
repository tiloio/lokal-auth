# lokal-auth

A local first browser based event driven database with end to end encryption with the possibility to share data with other users.

## Goals of this project

- [] end to end encryption
- [] save data with adapters in the browser (local first)
- [] first adapter should be indexeddb
- [] provide a "changed" hook to save data to the server
- [] provide a method to insert data which is loaded from the server
- [] use an event driven approach to store the data
  - [] there are no merge conflicts possible but we should have a notification way that someone changed something
- [] allow to share a workspace with other users


## Architecture

The architecture is based on the idea that the data is stored in the browser and the server is only used to provide a way to share data with other users or devices. The data is encrypted even on the client side. Only the encrypted keys are stored in the sessionStorage. The keys are encrypted with a password and a salt.

The data has to be stored via an `Workspace`. The `User` is only used to encrypt the `Workspace`-Keys. The `Workspace` can be shared with other users.

### Store Data

Maybe use @std/cbor to store the data.

### Keys

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

### How to exclude other user from a shared workspace?

If you have the key to that workspace, you can always access it. To prevent someone to have access, we have to change the encryption of everything. To do that we have to copy everything - which costs a lot.