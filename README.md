## translate-text

Use Google Translate to translate text

## install
```sh
$ git clone https://github.com/januwA/translate-text.git
$ npm i
$ npm run build
$ node dist/index.js --help

// Or install global commands
$ npm link
$ gt -h

// uninstall
$ gt unlink
```

## how to use

`$ gt [source_file] [source_language_code] [translate_language_code] [options]`

Options:
  - --path      data path                               [数组]
  - --origin    google | baidu | youdao | bing          [默认值: "google"]
  - --headless  无头模式                                 [布尔] [默认值: true]


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


// zh-CN to en
$ gt ./languages.json zh-CN en --path=name
$ cat ./languages.en.json


// en to ja
$ gt ./msg.txt en ja
$ cat msg.ja.txt


$ gt ./app_en.arb en zh-CN --path=description
$ cat app_en.zh-CN.arb

$ gt ./languages.json zh-CN ja -p=name --no-hl
```

## Use other origin
```sh
$ gt app_en.arb en el -o=baidu -p=description
```
Note: The language code used by different origin is likely to be different, which may cause translation failures

- [language_code zh](https://github.com/januwA/translate-text/blob/main/languages.json)
- [language_code en](https://github.com/januwA/translate-text/blob/main/languages.en.json)
- The language code must be written right!!!