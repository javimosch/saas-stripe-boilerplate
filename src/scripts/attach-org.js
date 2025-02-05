const dotenv = require('dotenv');
dotenv.config();

require('../globals/injectGlobals')(require('path').join(process.cwd(),'src', 'globals'));
global.loadModelsSync(require('path').join(process.cwd(),'src', 'models'));


async function createDefaultOrganization() {
    const { Organization, User, Order, Tool, Subscription, Service, PricingPlan } = global.getMongooseModels(['Organization', 'User', 'Order', 'Tool', 'Subscription', 'Service', 'PricingPlan']);
    const defaultOrg = await Organization.findOne({ name: 'default' });
    if (!defaultOrg) {
        const newOrg = new Organization({ name: 'default' });
        await newOrg.save();
        return newOrg;
    }
    return defaultOrg;
}

async function setDefaultOrgToDocuments() {
    const { Organization, User, Order, Tool, Subscription, Service, PricingPlan } = global.getMongooseModels(['Organization', 'User', 'Order', 'Tool', 'Subscription', 'Service', 'PricingPlan']);
    const defaultOrg = await createDefaultOrganization();
    const models = [User, Order, Tool, Subscription, Service, PricingPlan];

    for (const model of models) {
        const docsWithoutOrg = await model.find({ organization: { $exists: false } });
        for (const doc of docsWithoutOrg) {
            doc.organization = defaultOrg._id;
            await doc.save();
        }
        console.log(`Attached default organization to ${docsWithoutOrg.length} documents in ${model.modelName}.`);
    }
}

async function main() {
    console.log('Starting script...',{
        globals: global
    });
    try {
        await global.connectMongoDB()
        await setDefaultOrgToDocuments();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('Script completed.');
    }
}

main();