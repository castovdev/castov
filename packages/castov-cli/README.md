# castov-cli

[Castov](https://castov.com) developer utilities in your terminal. Zero config, zero server, one tiny dependency ([`@castov/sdk`](https://www.npmjs.com/package/@castov/sdk)).

```bash
npm install -g castov-cli
castov uuid
# bde2b3f7-cf85-44a2-a596-5a6b1fc3cbfc
```

Or without installing: `npx castov-cli uuid`

## Commands

```text
castov uuid                 Generate a UUID v4      (-n <count>, --v7, --upper)
castov nanoid [size]        Generate a URL-safe ID  (-n <count>)
castov encode <text>        Base64-encode           (--url)
castov decode <base64>      Base64-decode
castov hash <text>          Hex digest              (-a sha1|sha256|sha384|sha512)
castov now                  Current Unix timestamp + ISO 8601
castov unix <ts|iso>        Convert Unix <-> ISO 8601
castov jwt <token>          Decode a JWT locally (no verification)
castov --help | --version
```

Output is raw (no decorations), so it composes with the shell:

```bash
export REQUEST_ID=$(castov uuid)
castov uuid -n 1000 --v7 > ids.txt
echo -n "hello" | castov hash -a sha512
```

Colors are disabled automatically when piping or when `NO_COLOR` is set.

## License

MIT © Castov
