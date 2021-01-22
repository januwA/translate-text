## text-translate

Use Google Translate to translate text

## install
```sh
$ git clone https://github.com/januwA/translate-text.git
$ npm i
$ npm run build
$ node dist/index.js -h

// Or install global commands
$ npm link
$ gt -h

// uninstall
$ gt unlink
```

## how to use

`$ gt [source_file] [source_language_code] [translate_language_code] [options]`

Options:
  - --path    source object path


## Example

data.json
```json
[
  {
    "msg": "good morning",
    "title": "english"
  }
]
```

```sh
$ gt data.json en ja --path=msg --path=title
✔ success.        
$ cat data.ja.json
```

- [language_code zh](https://github.com/januwA/translate-text/blob/main/languages.json)
- [language_code en](https://github.com/januwA/translate-text/blob/main/languages.en.json)