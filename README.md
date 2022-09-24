# assets plugin for webpack

一个webpack插件，用来修改最终asset的文件路径或过滤文件。

> NOTE: Node v10+ and webpack v4+ are supported and tested.

## 关于

control-output-plugin用来修改最终asset的文件路径或过滤文件，该事件发生在compilation.hooks.afterProcessAssets中。需要注意的一点，它不会更改模块中的依赖关系，所以使用它你模块中的依赖将发生错误。还有一点它拥有clean-webpack-plugin的部分功能，用来清除过期的asset文件。

## 安装

`npm install --save-dev control-output-plugin`

## 使用

```js
import ControlOutputPlugin from 'control-output-plugin'

const webpackConfig = {
    plugins: [
        new ControlOutputPlugin(),
    ],
};

module.exports = webpackConfig;
```

## 选项

```js
new ControlOutputPlugin({
    // 资源输出路径控制。
    //
    // default: []
    control: [
        {
            // 过滤掉匹配的文件
            test: /\.js|map/,
            replace: null
        },
        {
            // 将匹配的文件移动到output的img文件夹内
            test: /\.png|jpe?g/,
            replace: 'img/[basename]'
        },
        {
            // 将匹配的文件的相对路径前再加一个font文件夹
            test: /\.ttf|eot|woff/,
            replace: 'font/[resolvePath]'
        },
        {
            // 在匹配的文件的相对路径前再加一个css文件夹
            test: /\.css/,
            replace: name => `css/${name}`
        }
    ],

    // del@4的options。
    // See https://www.npmjs.com/package/del
    //
    // default: {
    //   dot: true,
    //   force: true,
    //   dryRun: false,
    //   ...
    // }
    delOptions: {},

    // 是否提示
    //
    // default: true
    verbose: true
});
```
