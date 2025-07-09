const fs = require("fs");
const { IfcAPI, IFCPILE, IFCTEXT, IFCLABEL, IFCGLOBALLYUNIQUEID, IFCBUILDINGELEMENTPROXY, IFCRELDEFINESBYPROPERTIES, IFCRELAGGREGATES, IFCRELCONTAINEDINSPATIALSTRUCTURE, IFC4, Handle, IFCFOOTING } = require("../../dist/web-ifc-api-node.js");

console.log("Hello web-ifc-node!");

const ifcapi = new IfcAPI();

async function LoadFile(filename) {
    await ifcapi.Init();
    const ifcData = fs.readFileSync(filename);

    let modelID = ifcapi.OpenModel(ifcData);
    console.log(`Loaded model ${filename} to modelID ${modelID}`);

    const proxies = ifcapi.GetLineIDsWithType(modelID, IFCBUILDINGELEMENTPROXY);
    console.log(`Found ${proxies.size()} IFCBUILDINGELEMENTPROXY entities`);

    const updateReferences = async (oldID, newID) => {
        console.log(`Updating references from ${oldID} to ${newID}`);

        let relationshipTypes = [IFCRELAGGREGATES, IFCRELCONTAINEDINSPATIALSTRUCTURE];
        for (let relType of relationshipTypes) {
            let relations = ifcapi.GetLineIDsWithType(modelID, relType);
            for (let i = 0; i < relations.size(); i++) {
                let relID = relations.get(i);
                console.log(`Processing relationship ${relID}`);
                try {
                    let relation = await ifcapi.GetLine(modelID, relID);

                    if (relation.RelatedElements) {
                        let updated = false;
                        for (let j = 0; j < relation.RelatedElements.length; j++) {
                            if (relation.RelatedElements[j].value == oldID) {
                                relation.RelatedElements[j].value = newID;
                                console.log(`Updated RelatedElement ${j} to ${newID}`);
                                ifcapi.WriteLine(modelID, relation);
                                updated = true;
                            }
                        }
                        if (updated == true) {
                            console.log(`Relation ${relID} updated`);
                        } else {
                            console.log(`No update needed for Relation ${relID}`);
                        }
                    } else {
                        console.log(`Relation ${relID} has no RelatedElements array`);
                    }
                } catch (error) {
                    console.error(`Error processing relation ${relID}: ${error.message}`);
                }
            }
        }
    };

    let count = 0;


    for (let i = 0; i < proxies.size(); i++) {
        let entityID = proxies.get(i);
        let entity = await ifcapi.GetLine(modelID, entityID);
        
        if (entity.Name && entity.Name.value.startsWith('Pile') && !entity.Name.value.startsWith('PileRef')) {
            console.log(`Found Pile entity with ID ${entityID}`);
            count++;
            let newEntityID = ifcapi.GetMaxExpressID(modelID) + 1;
            let Pile = {
                expressID: newEntityID,
                type: IFCPILE,
                GlobalId: ifcapi.CreateIfcType(modelID, IFCGLOBALLYUNIQUEID, `objbjghbthbrg5f7vb53d`),
                Name: ifcapi.CreateIfcType(modelID, IFCLABEL, `Pile ${count}`),
                Description: ifcapi.CreateIfcType(modelID, IFCTEXT, 'Description for new pile'),
                ObjectPlacement: entity.ObjectPlacement,
                Representation: entity.Representation,
                OwnerHistory: entity.OwnerHistory,
                Tag: entity.Tag,
                PredefinedType: entity.PredefinedType,
            };

            await updateReferences(entityID, newEntityID);

            ifcapi.WriteLine(modelID, Pile);
            console.log(`Written new entity with ID ${newEntityID}`);

            ifcapi.DeleteLine(modelID, entityID);
            console.log(`Deleted old entity with ID ${entityID}`);
        
        }else if (entity.Name && entity.Name.value.startsWith('Footing')) {
            console.log(`Found Footing entity with ID ${entityID}`);
            count++;
            let newEntityID = ifcapi.GetMaxExpressID(modelID) + 1;
            let Footing = {
                expressID: newEntityID,
                type: IFCFOOTING,
                GlobalId: ifcapi.CreateIfcType(modelID, IFCGLOBALLYUNIQUEID, 'objbjghbthbrg5f7vb40d'),
                Name: ifcapi.CreateIfcType(modelID, IFCLABEL, `Footing ${count}`),
                Description: ifcapi.CreateIfcType(modelID, IFCTEXT, 'Description for new footing'),
                ObjectPlacement: entity.ObjectPlacement,
                Representation: entity.Representation,
                OwnerHistory: entity.OwnerHistory,
                Tag: entity.Tag,
                PredefinedType: entity.PredefinedType,
            };

  

            await updateReferences(entityID, newEntityID);

            ifcapi.WriteLine(modelID, Footing);
            console.log(`Written new entity with ID ${newEntityID}`);

            ifcapi.DeleteLine(modelID, entityID);
            console.log(`Deleted old entity with ID ${entityID}`);
          
        }
        
    }
    

    fs.writeFileSync("modified.ifc", ifcapi.SaveModel(modelID));
    console.log("Modified IFC file saved as 'modified.ifc'");

    ifcapi.CloseModel(modelID);
}

LoadFile("C:/Users/TUĞBA/OneDrive - TED Üniversitesi/Masaüstü/engine_web-ifc-main/examples/model.ifc");



