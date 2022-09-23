import path from 'path'
import del from 'del'
import { validate } from 'schema-utils'

const pluginName = 'control-output-plugin'

const defaultOptions = {
  additionalProperties: true,
  properties: {
    control: {
      description: '资源输出路径控制',
      type: 'array'
    },
    delOptions: {
      description: 'del的options',
      type: 'object'
    },
    verbose: {
      description: '是否提示',
      type: 'boolean'
    }
  },
  type: 'object'
}

const defaultControlItemOptions = {
  additionalProperties: true,
  properties: {
    test: {
      description: '资源路径匹配',
      anyOf: [
        {
          type: 'string'
        },
        {
          instanceof: 'Function'
        },
        {
          instanceof: 'RegExp'
        }
      ]
    },
    replace: {
      description: '资源路径替换',
      anyOf: [
        {
          type: 'null'
        },
        {
          type: 'string'
        },
        {
          instanceof: 'Function'
        }
      ]
    }
  },
  type: 'object'
}

export default class ControlOutputPlugin {
  constructor(options = {}) {
    this.options = Object.assign({
      control: [],
      delOptions: {},
      verbose: true
    }, options)

    validate(defaultOptions, this.options)

    this.options.control.forEach(item => {
      validate(defaultControlItemOptions, item)
    })

    this.outputPath = ''
    this.currentAssets = []
  }

  apply(compiler) {
    if (!compiler.options.output || !compiler.options.output.path) {
      console.warn(`${pluginName}: options.output.path not defined. Plugin disabled...`)
      return
    }

    this.outputPath = compiler.options.output.path

    compiler.hooks.emit.tap(pluginName, compilation => {
      // 判断是否编译错误
      if (this.error(compilation.getStats())) return
      // 替换路径
      const assets = compilation.assets
      Object.keys(assets).forEach(name => {
        const newName = this.redirect(name)
        if (newName === name) return

        if (newName) {
          compilation.renameAsset(name, newName)
        } else {
          compilation.deleteAsset(name)
        }
      })
    })

    compiler.hooks.done.tap(pluginName, stats => {
      // 判断是否编译错误
      if (this.error(stats)) return
      // 删除多余文件
      const assetNames = Object.keys(stats.compilation.assets)
      const removePatterns = this.currentAssets.filter(previousAsset => {
        return assetNames.includes(previousAsset) === false
      })
      this.currentAssets = assetNames
      removePatterns.length && this.remove(removePatterns)
    })
  }

  redirect(name) {
    return this.options.control.reduce((target, item) => {
      return this.test(target, item.test)
        ? this.replace(target, item.replace)
        : target
    }, name)
  }

  test(name, test) {
    if (test instanceof RegExp) {
      return test.test(name)
    } else if (typeof test === 'function') {
      return test(name)
    } else if (typeof test === 'string') {
      return ~name.indexOf(test)
    } else {
      return false
    }
  }

  replace(name, replace) {
    const basename = path.basename(name)
    if (typeof replace === "function") {
      return replace(name)
    } else if (typeof replace === "string") {
      return replace
        .replace(/\[basename\]/g, basename)
        .replace(/\[resolvePath\]/g, name)
    } else {
      return null
    }
  }

  remove(patterns) {
    const deleted = del.sync(patterns, Object.assign({
      dot: true,
      force: true,
      dryRun: false,
      cwd: this.outputPath,
      ignore: this.currentAssets
    }, this.options.delOptions))
    
    this.options.verbose && deleted.forEach(file => {
      const filename = path.relative(process.cwd(), file)
      console.warn(`${pluginName}: removed ${filename}`)
    })
  }

  error(stats) {
    if (stats.hasErrors()) {
      this.options.verbose && console.warn(`${pluginName}: pausing due to webpack errors`)
      return true
    } else {
      return false
    }
  }
}
