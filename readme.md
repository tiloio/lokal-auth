# lokal-auth

A local first browser based event driven database with end to end encryption
with the possibility to share data with other users.

## Goals of this project

- [x] end to end encryption
- [] save data with adapters in the browser (local first)
- [] first adapter should be indexeddb
- [] provide a "changed" hook to save data to the server
- [] provide a method to insert data which is loaded from the server
- [] use an event driven approach to store the data
  - [] there are no merge conflicts possible but we should have a notification
    way that someone changed something
- [] allow to share a workspace with other users

## Todos

- [x] load user from local storage
  - [x] add adapter ~~and encoding~~ to User class to be able to save and load
        workspaces
  - [x] save and load workspaces to adapter
- [] message bus for messages:
  - [] user created,
  - [] user edited,
  - [] workspace created,
  - [] workspace edited ??? do we need this?,
  - [] workspace deleted,
  - [] event created.
- [] Create PathAssembler to assemble alle events under one path into the latest
  object
  - [] LATER: add performace optimizations with caching??? or assemble stop if
    all known keys are filled (therefore we have to know the keys from the very
    last event)??? -- we can cache the current state in the path like `car/1/#`
    is the current state of the `car/1`. This `/#` path is getting updated with
    every event.
- [] create event local storage adapters
- [] create event indexeddb adapters
- [] create user store indexeddb adapters
- [] LATER: maybe add caching of current event to the path???

## Known Issues

- [ ] https://jsr.io/@std/cbor encodes numbers as bigints if they are big. This
      will make the JavaScript object have a number like `1234565432n` - which
      is not a number.

## Architecture

The architecture is based on the idea that the data is stored in the browser and
the server is only used to provide a way to share data with other users or
devices. The data is encrypted even on the client side. Only the encrypted keys
are stored in the sessionStorage. The keys are encrypted with a password and a
salt.

The data has to be stored via an `Workspace`. The `User` is only used to encrypt
the `Workspace`-Keys. The `Workspace` can be shared with other users.

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

To share a workspace key with another user, you can create a new UserKey with a
special password which is used to encrypt the workspace key. The UserKey can
then be exported as JSON Web Key which can be shared with the other user.

### How to exclude other user from a shared workspace?

If you have the key to that workspace, you can always access it. To prevent
someone to have access, we have to change the encryption of everything. To do
that we have to copy everything - which costs a lot.

# Development

## Scripts

```bash
deno task pcc # pre commit check: formatting, linting, and testing
deno task dev # testing with watcher
deno task bench # benchmarking
```
