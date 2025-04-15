import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { addJsonOutput, capitalize, findUsed, getEnumKey, translate } from './format';
import { resolve, join } from 'path';

/**
 * deal code
 * @param {'ts' | 'cs'} codeType 文件类型(typescript/C#)
 * @param {*} attrs 
 * @param {*} options 
 * @param {string} logicalName 实体逻辑名
 * @param {boolean} cleanMode 干净模式，会根据实际的使用情况，过滤掉未使用的字段(Enum暂时没处理)
 * @param {string} relativePath 生成的相对路径
 * @param {string} searchPath 搜索有没有使用过时的文件路径(只有cleanMode使用)
 * @param {string} namespace cs模式下的命名空间前缀
 */
const deal = async (codeType, attrs, options, logicalName, cleanMode, relativePath, searchPath, namespace) => {
  let enums = '';
  let entities = '';
  let tests = '';
  let imports = '';
  let modelName = capitalize(logicalName);

  // 日期写死，防止每次更新生成一堆变化

  const commonNames = [
    'createdby',
    'createdon',
    'createdonbehalfby',
    'importsequencenumber',
    'modifiedby',
    'modifiedon',
    'modifiedonbehalfby',
    'overriddencreatedon',
    'ownerid',
    'owningbusinessunit',
    'owningteam',
    'owninguser',
    'timezoneruleversionnumber',
    'utcconversiontimezonecode',
    'versionnumber',
  ];

  const jsonOutput = {
    includes: [],
    excludes: [],
    tbds: [],
    notsupports: [],
  }; // 因为C#中会校验文件过大，所以允许定义取哪些字段

  for (const v of attrs) {
    if(v.DisplayName.UserLocalizedLabel?.Label && v.DisplayName.UserLocalizedLabel?.Label.toUpperCase().includes('(TBD)')) {
      // 要删除的列不要用
      addJsonOutput(jsonOutput, 'tbds', v);
      continue;
    }
    if (v.AttributeOf && v.AttributeTypeName?.Value !== 'ImageType') {
      // 目前只支持ImageType
      addJsonOutput(jsonOutput, 'notsupports', v);
      continue;
    }
    let name = v.LogicalName;
    if (codeType === 'ts' && commonNames.includes(name)) {
      continue;
    }

    let cleanName = capitalize(name);  // `${capitalize(name)}${modelName}`; // 加入modelName方便查找是否使用过

    if(cleanMode) {
      // 检查字段名是否使用到，没使用到加入excludes
      // TODO: ts虽然有treeshake，但是在构建fetchxml的时候，还是少点好
      if(codeType === 'cs') {
        const foundUsed = findUsed(searchPath, [cleanName, v.LogicalName], [join(relativePath, 'Entities'), join(relativePath, 'Enums')]);
        if(!foundUsed) {
          addJsonOutput(jsonOutput, 'excludes', v);
          continue;
        }
      }
    }

    addJsonOutput(jsonOutput, 'includes', v);
    
    let type = 'string';
    let method = 'GetStringValue';
    let setValue = '';
    if (codeType === 'cs') {
      setValue = `set { entity[${name}] = value; }`;
    }
    let getValue = '';
    let multipleLookupSet = '';
    let targets = '';
    let testValue = 'string.Empty';
    switch (v.AttributeType) {
      case 'Boolean':
        if (codeType === 'ts') {
          type = 'boolean | null';
        } else {
          type = 'bool';
          method = 'GetBooleanValue';
          testValue = true;
        }
        break;
      case 'DateTime':
        if (codeType === 'ts') {
          type = 'string';
          getValue = `get ${cleanName}(): ${type} {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'];
\t\t} else {
\t\t\treturn this.entity?.[${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'];
\t\t}
\t}`;
        } else {
          type = 'DateTime?';
          method = 'GetTimeValueWithNull';
          testValue = "DateTime.Now";
        }
        break;
      case 'Decimal':
        if (codeType === 'ts') {
          type = 'number | null';
        } else {
          type = 'decimal';
          method = 'GetDecimalValue';
          testValue = '0';
        }
        break;
      case 'Money':
        if (codeType === 'ts') {
          type = 'number | null';
        } else {
          type = 'decimal';
          method = 'GetMoneyValue';
          setValue = `set { entity[${name}] = new Money(value); }`;
          testValue = '0';
        }
        break;
      case 'Double':
        if (codeType === 'ts') {
          type = 'number | null';
        } else {
          type = 'double';
          method = 'GetFloatingPointNumber';
          testValue = '0';
        }
        break;
      case 'Integer':
      case 'BigInt':
        if (codeType === 'ts') {
          type = 'number | null';
        } else {
          type = 'int';
          method = 'GetWholeNumberValue';
          testValue = '0';
        }
        break;
      case 'Uniqueidentifier':
        if (codeType === 'ts') {
          type = 'string';
        } else {
          type = 'Guid';
          getValue = `get { return this.GetUniqueidentifier(${name}); }`;
          testValue = 'Guid.NewGuid()';
        }
        break;
      case 'Customer':
      case 'Lookup':
      case 'Owner':
        if (codeType === 'ts') {
          type = 'string';
          if (v.Targets) {
            targets = v.Targets.join(',');
          }
          getValue = `get ${cleanName}(): ${type} {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name}];
\t\t} else {
\t\t\treturn this.entity?.['_' + ${modelName}Entity._${name} + '_value'];
\t\t}
\t}
\t/** 
\t * ${v.SchemaName} FormattedValue
\t * @typedef ${v.AttributeType}
\t * @memberof ${targets}
\t * @description ${translate(v.DisplayName.UserLocalizedLabel?.Label)}
\t * @return string
\t */
\tget ${cleanName}Name(): string {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'];
\t\t} else {
\t\t\treturn this.entity?.['_' + ${modelName}Entity._${name} + '_value@OData.Community.Display.V1.FormattedValue'];
\t\t}
\t}
\tset${cleanName}Name = (v: string) => {
\t\tthis.entity['_' + ${modelName}Entity._${name} + '_value@OData.Community.Display.V1.FormattedValue'] = v;
\t}
\tget ${cleanName}EntityName(): string {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name} + '@Microsoft.Dynamics.CRM.lookuplogicalname'];
\t\t} else {
\t\t\treturn this.entity?.['_' + ${modelName}Entity._${name} + '_value@Microsoft.Dynamics.CRM.lookuplogicalname'];
\t\t}
\t}`;
          if (v.Targets && v.Targets.length === 1) {
            setValue = `set ${cleanName}(value: string) {
\t\tthis.entity[${modelName}Entity._${name} + '@odata.bind'] = '/${v.Targets[0]}s(' + value + ')';    
\t}
`;
          } else {
            setValue = `// NOREF: set ${cleanName}(value: string)`;
          }
        } else {
          type = 'Guid';
          method = 'GetLookupId';
          testValue = 'Guid.NewGuid()';
          if (v.Targets && v.Targets.length === 1) {
            if (existsSync(join(relativePath, `Entities/${capitalize(v.Targets[0])}Entity.cs`))) {
              setValue = `set { entity[${name}] = value != Guid.Empty ? new EntityReference(${capitalize(v.Targets[0])}Entity.LogicalName, value) : (object)null; }`;
            } else {
              setValue = `// NOREF: add ${v.Targets[0]}`;
              testValue = '';
            }
            multipleLookupSet = `
\t\tpublic string ${cleanName}Name { 
\t\t\tget { return this.GetLookupName(${name}); }
\t\t}
`;
          } else {
            // 多个lookup
            setValue = '';
            testValue = '';
            multipleLookupSet = `      
\t\tpublic void SetLookupValue${cleanName}(string entityLogicName, Guid value) { 
\t\t\tentity[${name}] = new EntityReference(entityLogicName, value);
\t\t}
\t\tpublic string ${cleanName}Name { 
\t\t\tget { return this.GetLookupName(${name}); }
\t\t}
\t\tpublic string ${cleanName}EntityName { 
\t\t\tget { return this.GetLookupLogicalName(${name}); }
\t\t}
`;
          }
          if (v.Targets) {
            targets = v.Targets.join(',');
          }
        }
        break;
      case 'Picklist':
      case 'State':
      case 'Status':
        if (codeType === 'ts') {
          // 判断enum类型
          type = 'number';
          const found = options.find(c => c.LogicalName === v.LogicalName);
          if (found) {
            type = `Enum${capitalize(found.OptionSet.Name)}`;
          }
          getValue = `get ${cleanName}(): ${type} {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name}];
\t\t} else {
\t\t\treturn this.entity?.[${modelName}Entity._${name}];
\t\t}
\t}
\t/** 
\t * ${v.SchemaName} FormattedValue
\t * @typedef ${v.AttributeType}
\t * @memberof${targets}
\t * @description ${translate(v.DisplayName.UserLocalizedLabel?.Label)}
\t * @return string
\t */
\tget ${cleanName}Name(): string {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'];
\t\t} else {
\t\t\treturn this.entity?.[${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'];
\t\t}
\t}
\tset${cleanName}Name = (v: string) => {
\t\tthis.entity[${modelName}Entity._${name} + '@OData.Community.Display.V1.FormattedValue'] = v;
\t}`;
        } else {
          type = 'int';
          method = 'GetOptionValue';
          setValue = `set { entity[${name}] = new OptionSetValue((int)value); }`;
          testValue = '0';
          const found = options.find(c => c.LogicalName === v.LogicalName);
          if (found) {
            testValue = `Enum${capitalize(found.OptionSet.Name)}.${getEnumKey(found.OptionSet.Options[0])}`;
          }
        }
        break;
      case 'PartyList':
        // Email里会用到
        if (codeType === 'ts') {
          type = 'any[]';
          getValue = `// Not implemented`; // 不做get
          setValue = `// Not implemented`;
        } else {
          type = 'ActivitypartyEntity[]';
          getValue = `get { throw new NotSupportedException(); }`; // 不做get
          setValue = `set { entity[${name}] = value.Select(c => c.entity).ToArray(); }`;
          testValue = 'Array.Empty<ActivitypartyEntity>()';
        }
        break;
      // case 'String':
      // case 'EntityName':
      case 'Virtual':
        // Image
        type = 'string';
        method = 'GetStringValue';
        if (codeType === 'ts') {
          // Not implementation
        } else {
          getValue = `get { return this.GetVirtualValue(${name}); }`;
          setValue = `set { entity[${name}] = Convert.FromBase64String(value); }`;
        }
        break;
      default:
        // type = 'string';
        // method = 'GetStringValue';
        break;
    }
    if (v.AttributeType === 'Picklist'
      || v.AttributeType === 'State'
      || v.AttributeType === 'Status') {
      // 判断enum类型
      const found = options.find(c => c.LogicalName === v.LogicalName);
      if (found) {
        type = `Enum${capitalize(found.OptionSet.Name)}`;
        if (codeType === 'cs') {
          getValue = `get { return (${type})this.${method}(${name}); }`;
        }
      }
    }
    if (codeType === 'ts') {
      if (!setValue) {
        setValue = `set ${cleanName}(value: ${type}) {
\t\tthis.entity[${modelName}Entity._${name}] = value;    
\t}
`;
      }
      entities += `
\t//#region ${name}
\tpublic static readonly _${name} = '${name}';
\t/** 
\t * ${v.SchemaName} 
\t * @typedef ${v.AttributeType}
\t * @memberof${targets}
\t * @description ${translate(v.DisplayName.UserLocalizedLabel?.Label)}
\t * @return ${type}
\t */
\t${getValue || `get ${cleanName}(): ${type} {
\t\tif(this.prefix) {
\t\t\treturn this.entity?.[this.prefix + '.' + ${modelName}Entity._${name}];
\t\t} else {
\t\t\treturn this.entity?.[${modelName}Entity._${name}];
\t\t}
\t}`}
\t${v.FormulaDefinition/** 公式不要set */ ? '' : setValue}
\t//#endregion ${name}
`;
    } else {
      entities += `
\t\t#region ${name}
\t\tpublic const string ${name} = nameof(${name});
\t\t/// <summary>${v.SchemaName} <c>${v.AttributeType}</c> ${targets.length > 100 ? targets.substring(0, 100) + '...' : targets}</summary>
\t\t/// <remarks>${translate(v.DisplayName.UserLocalizedLabel?.Label)}</remarks>
\t\t${(v.FormulaDefinition || !setValue) ? '' : '[DataMember]'}
\t\tpublic ${type} ${cleanName} { 
\t\t\t${getValue || `get { return this.${method}(${name}); }`}
\t\t\t${v.FormulaDefinition/** 公式不要set */ ? '' : setValue}
\t\t}
${multipleLookupSet}
\t\t#endregion ${name}
`;
      if (testValue && !v.FormulaDefinition/** 公式不要set */) {
        const valueName = name === 'value' ? 'value1' : 'value';
        if (tests) {
          tests += `
`;
        }
        tests += `\t\t/// <summary>
\t\t/// Tests the ${cleanName} property.
\t\t/// </summary>
\t\t[TestMethod]
\t\tpublic void ${cleanName}_Should_Set_And_Get_Value()
\t\t{
\t\t\ttry
\t\t\t{
\t\t\t\tvar ${valueName} = ${testValue};
\t\t\t\tvar ${name} = new ${modelName}Entity(new Entity(${modelName}Entity.LogicalName))
\t\t\t\t{
\t\t\t\t\t${cleanName} = ${valueName},
\t\t\t\t};
\t\t\t\tAssert.AreEqual(${valueName}, ${name}.${cleanName});
\t\t\t}
\t\t\tcatch (Exception ex)
\t\t\t{
\t\t\t\tStringAssert.Contains(ex.Message, " ", StringComparison.InvariantCultureIgnoreCase);
\t\t\t}
\t\t}
`;
      }
    }
  }
  const allOptionNames = [];
  for (const v of options) {
    let name = capitalize(v.OptionSet.Name);

    if (allOptionNames.includes(name)) {
      continue;
    }
    allOptionNames.push(name);

    let opts = '';
    for (const o of v.OptionSet.Options) {
      if (!o.Label.UserLocalizedLabel) {
        continue;
      }
      if(o.Label.UserLocalizedLabel.Label.includes('(TBD)')) {
        continue;
      }
      let key = getEnumKey(o);
      if (codeType === 'ts') {
        opts += `
\t/**
\t * ${translate(o.Label.UserLocalizedLabel.Label)}
\t */
\t${key} = ${o.Value},
`;
      } else {
        opts += `
\t\t\t/// <summary>${translate(o.Label.UserLocalizedLabel.Label).trim().replaceAll('TODO', 'UEQT')}</summary>
\t\t\t${key} = ${o.Value},
`;
      }
    }
    let currentEnum = '';
    if (codeType === 'ts') {
      if (v.OptionSet.IsGlobal) {
        imports += `import { Enum${name} } from "../Enums/Enum${name}";
`;
      }
      currentEnum = `
/** 
* ${v.OptionSet.Name}
* @description ${translate(v.OptionSet.DisplayName?.UserLocalizedLabel?.Label)}
*/
export enum Enum${name}
{
${opts}
}
`;
    } else {
      currentEnum = `
\t\t/// <summary>${v.OptionSet.Name.trim()}</summary>
\t\t/// <remarks>${translate(v.OptionSet.DisplayName?.UserLocalizedLabel?.Label)}</remarks>
\t\tpublic enum Enum${name}
\t\t{
${opts}
\t\t}
`;
    }
    if (v.OptionSet.IsGlobal) {
      // 全局枚举，新建文件
      let filePath = join(relativePath, 'Enums');
      let fileName = '';
      let fileData = '';
      if (codeType === 'ts') {
        fileName = `Enum${name}.ts`;
        fileData = `${currentEnum}`;
      } else {
        fileName = `Enum${name}.cs`;
        fileData = `// <copyright file="Enum${name}.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>
// <author>Xjs</author>
// <date>2025-01-01</date>
// <summary>Enum${name}</summary>

namespace ${namespace}Enums
{
\t${currentEnum}
}
`.replaceAll('\t', '    ').replaceAll('\n', '\r\n');
      }
      console.log(resolve(`${filePath}/${fileName}`));
      mkdirSync(resolve(filePath), { recursive: true });
      writeFileSync(resolve(`${filePath}/${fileName}`), fileData, { encoding: 'utf-8' });
      continue;
    } else {
      // 局部枚举
      enums += currentEnum;
    }
  }
  let result = '';
  // console.log(result);
  let filePath = join(relativePath, 'Entities');
  let fileName = '';
  if (codeType === 'ts') {
    fileName = `${modelName}Entity.ts`;
    result = `${imports}
import { BaseEntity } from "upcf/Data/BaseEntity";

export class ${modelName}Entity extends BaseEntity {
\tstatic readonly LogicalName = '${logicalName}';
\toverride EntityLogicalName: string = ${modelName}Entity.LogicalName;
${entities}
}
${enums}
`;
  } else {
    fileName = `${modelName}Entity.cs`;
    result = `// <copyright file="${modelName}.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>
// <author>Xjs</author>
// <date>2025-01-01</date>
// <summary>${modelName}</summary>

using System;
using System.Linq;
using System.Runtime.Serialization;
using Microsoft.Xrm.Sdk;
using ${namespace}Base;
using ${namespace}Enums;

namespace ${namespace}Entities
{
[DataContract]
\tinternal class ${modelName}Entity : BaseEntity
\t{
\t\tpublic ${modelName}Entity() { }
\t\tpublic ${modelName}Entity(Guid id)
\t\t\t: base(id) {
\t\t}
\t\tpublic ${modelName}Entity(Entity entity, string prefix = "")
\t\t\t: base(entity, prefix) {
\t\t}
\t\tpublic const string LogicalName = "${logicalName}";
\t\tpublic override string EntityLogicalName => LogicalName;
${entities}
\t}
}  
`.replaceAll('\t', '    ').replaceAll('\n', '\r\n');

    // #region json
    const filePathJson = join(relativePath,'Entities');
    const fileNameJson = `${modelName}Entity.json`;
    const resultJson = JSON.stringify(jsonOutput, null, 2);
    console.log(resolve(`${filePathJson}/${fileNameJson}`));
    mkdirSync(resolve(filePathJson), { recursive: true });
    writeFileSync(resolve(`${filePathJson}/${fileNameJson}`), resultJson, { encoding: 'utf-8' });
    // #endregion

    // #region unittest
    const filePathTest = '../../Tests/Entities';
    const fileNameTest = `${modelName}EntityTests.cs`;
    const resultTest = `// <copyright file="${modelName}EntityTests.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>
// <author>Xjs</author>
// <date>2025-01-01</date>
// <summary>${modelName}EntityTests</summary>

namespace ${namespace}Tests.Entities
{
\tusing System;
\tusing global::Plugins.Tests;
\tusing Microsoft.VisualStudio.TestTools.UnitTesting;
\tusing Microsoft.Xrm.Sdk;
\tusing ${namespace}Entities;
\tusing ${namespace}Enums;

\t/// <summary>
\t/// This is a test class for MsdynWarehouseEntity and is intended to contain all MsdynWarehouseEntity Unit Tests.
\t/// </summary>
\t[TestClass]
\tpublic class ${modelName}EntityTests : TestBaseClass
\t{
${tests}\t}
}
`.replaceAll('\t', '    ').replaceAll('\n', '\r\n');
    console.log(resolve(`${filePathTest}/${fileNameTest}`));
    mkdirSync(resolve(filePathTest), { recursive: true });
    writeFileSync(resolve(`${filePathTest}/${fileNameTest}`), resultTest, { encoding: 'utf-8' });
    // #endregion unittest

  }
  console.log(resolve(`${filePath}/${fileName}`));
  mkdirSync(resolve(filePath), { recursive: true });
  writeFileSync(resolve(`${filePath}/${fileName}`), result, { encoding: 'utf-8' });

  if (codeType === 'cs' && enums) {
    // Enum
    filePath = join(relativePath, 'Entities');
    fileName = `${modelName}EntityEnum.cs`;
    result = `// <copyright file="${modelName}Enum.cs" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>
// <author>Xjs</author>
// <date>2025-01-01</date>
// <summary>${modelName}Enum</summary>

namespace ${namespace}Enums
{
${enums}
}  
`.replaceAll('\t', '    ').replaceAll('\n', '\r\n');

    console.log(resolve(`${filePath}/${fileName}`));
    mkdirSync(resolve(filePath), { recursive: true });
    writeFileSync(resolve(`${filePath}/${fileName}`), result, { encoding: 'utf-8' });
  }
}

export { deal };
