/**
 * Collects environment variables prefixed with 'TW_' and combines them with a global brand name
 * into an object suitable for use as data in an EJS template.
 *
 * @returns {Object} The data object containing the brand name and collected environment variables.
 */
function getEjsData() {
    
    const envs = [/* ['twTextClass', 'TW_TEXT_COLOR_CLASS'] */];
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TW_') && !envs.some(env => (Array.isArray(env) ? env[1] : env) === key)) {
        envs.push(key);
      }
    });
  
    const data = envs.reduce((acc, key) => {
      const envKey = key instanceof Array ? key[1] : key;
      const dataKey = key instanceof Array ? key[0] : key;
      acc[dataKey] = process.env[envKey];
      return acc;
    }, {});
  
    const finalData = { brandName: process.env.BRAND_NAME || 'BRAND_NAME', ...data };
    
    //console.log('ejsData', { data: finalData });
  
    return finalData;
  }
  
  module.exports = getEjsData;