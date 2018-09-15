"use strict"

const logger = require('gorilog')('ezdbee')
const fs = require('fs-extra')
const Mutex = require('await-semaphore').Mutex

class FileDriver {

  constructor(opt) {
    if (! opt.fileName) {
      throw new Error('no opt.fileName')
    }
    this.fileName = opt.fileName
  }

  async save(obj) {
    await fs.writeJson(this.fileName, obj)
  }

  async load() {
    return await fs.readJson(this.fileName)
  }
}


class EZDBee {
  constructor(opt) {
    this.opt = opt
    this.driver = new FileDriver(this.opt)
    this.json = null
    this.mutex = new Mutex()
    logger.trace('constructor:', this.opt, this.driver)
  }

  async init() {
    if (this.json) {
      logger.trace('init: already initialized.', this.json)
      return true
    }
    try {
      this.json = await this.driver.load()
      this.json = this.json || {}
      logger.debug('init1 ok.', this.opt, this.json)
      return true
    } catch(err) {
      logger.debug('init1 err.', this.opt, err)
      this.json = {}
      try {
        await this.driver.save(this.json)
        logger.debug('init2 ok.', this.opt)
        return true
      } catch(err) {
        logger.debug('init err.', this.opt, err)
        return false
      }
    }
  }

  async read(fn) {
    this.mutex.use(async ()=>{
      const org = JSON.stringify(this.json)
      const _json = fn(JSON.parse(org))
      if (_json) {
        logger.warn('This is read only method. Not modified.', this.opt)
      } else {
        logger.debug('read only ok.', this.opt)
      }
    })
  }

  async transaction(fn) {
    this.mutex.use(async ()=>{
      const org = JSON.stringify(this.json)
      const _json = fn(JSON.parse(org))
      if (! _json) {
        logger.debug('not modified ok1.', this.opt)
        return
      }

      const mod = JSON.stringify(_json)
      if (mod == org) {
        logger.debug('not modified ok2.', this.opt)
        return
      }

      try {
        this.json = _json
        await this.driver.save(this.json)
        logger.debug('save ok.', this.opt)
      } catch (err) {
        logger.error('save err.', this.opt, err)
      }
    })
  }

}


module.exports = EZDBee
