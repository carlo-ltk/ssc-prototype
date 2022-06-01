exports.handler = async (event) => {
    
  const cf = event.Records[0].cf
  const eventType = cf.config.eventType
  const request = cf.request
  
  const originA = 'ssc-prototype-origin-a'
  const originB = 'ssc-prototype-origin-b'
  
  const parameters = new URLSearchParams(request.querystring)
  
  console.log(`Event type: [${eventType}]`)
  
  switch (eventType) {
      case 'origin-request':
          console.log(request)
          if (parameters.has('regen-cache')
              && request.origin.s3.domainName.startsWith(originA)
          ) {
              console.log("[regen-cache] found, altering origin")
              request.origin = {
                  s3: {
                      domainName: `${originB}.s3.amazonaws.com`,
                       region: '',
                       authMethod: 'none',
                       path: '',
                       customHeaders: {}
                  }
              }
              request.headers['host'] = [{ key: 'host', value: `${originB}.s3.amazonaws.com`}]
              // Here we trigger (async) cache generation for the requested page
          }
          return request
          // break
      case 'origin-response':
          const response = cf.response
          console.log(response)
          if (request.origin.s3.domainName.startsWith(originA) 
              && response.status === '404' || response.status === '403') {
                  console.log(`Origin [${originA}] responded with statusCode [${response.status}]`)
                  console.log(`Request cache generation for ${request.uri}`)
                  // Here we trigger (async) cache generation for requested page
                  // so when completed, next requests to the same page will find it in originA
              }
          return response
      default:
          throw new Error(`Unhandled eventType [${eventType}]`)
  }
};