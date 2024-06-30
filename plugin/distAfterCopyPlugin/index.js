const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

const resolve = dir => path.resolve(__dirname, dir)
const log = console.log

// 递归复制文件夹  
async function copyDir(src, dest) {
  try {
    const stats = await fs.promises.stat(src)
    if (stats.isDirectory()) {
      // 创建目标文件夹  
      await fs.promises.mkdir(dest, { recursive: true })
      // 读取源文件夹中的所有文件和子文件夹  
      const entries = await fs.promises.readdir(src, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        // 递归复制  
        await copyDir(srcPath, destPath)
      }
    } else if (stats.isFile()) {
      // 复制文件  
      await fs.promises.copyFile(src, dest)
      log(chalk.green(`文件 ${src} 已复制到 ${dest}`))
    }
  } catch (err) {
    log(chalk.red(`复制文件夹时出错: ${err}`))
  }
}

function isDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fs.lstat(filePath, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats.isDirectory())
      }
    });
  });
}

/**
 * 复制文件夹及其所有文件到目标路径
 * @param {string} sourceDir 源文件目录
 * @param {*} destDir 目标文件目录
 * @returns 
 */
const build = async (sourceDir = '', destDir = '') => {
  let isDir
  try {
    isDir = await isDirectory(sourceDir)
  } catch {
    isDir = false
  }


  if (!isDir) {
    log(chalk.red('请输入真实存在的文件夹!'))
    return
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir)
  }

  return new Promise(async (resolve, reject) => {
    copyDir(sourceDir, destDir)
      .then(() => {
        log(chalk.blue.bold('复制完成！'))
        resolve(true)
      })
      .catch((err) => {
        log(chalk.red('复制过程中发生错误：', err))
        resolve(false)
      });
  })


}


class TestPlugin {
  constructor(options = {}) {
    const defaultOptions = {
      sourceDir: resolve('../../dist'),
      destDir: resolve('../../dest')
    }

    this.options = { ...defaultOptions, ...options }
  }

  // 在插件函数的 prototype 上定义一个 `apply` 方法，以 compiler 为参数。
  apply(compiler) {
    // 指定一个挂载到 webpack 自身的事件钩子。
    compiler.hooks.afterEmit.tap('TestPlugin', async (compilation) => {
      log('options', this.options)
      await build(this.options.sourceDir, this.options.destDir)

      console.log('构建结束')
    })
  }
}

module.exports = TestPlugin