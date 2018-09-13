"use strict"

const EZDBee = require('./index.js')
const logger = require('gorilog')('test')

logger.trace('start')
const db = new EZDBee({fileName: __dirname+'/db.json'})
db.init()
  .then(async ()=>{
    await db.read(data => {
      logger.debug('data:', data)
      data.hello = data.hello || []
      data.hello.push('world')
      logger.debug('data.hello:', data.hello)
      //return data
    })
  })
  .then(async ()=>{
    await db.transaction(data => {
      logger.debug('data:', data)
      data.hello = data.hello || []
      data.hello.push('world')
      logger.debug('data.hello:', data.hello)
      return data
    })
  })
  .then(async ()=>{
    await db.transaction(data => {
      return
    })
  })
