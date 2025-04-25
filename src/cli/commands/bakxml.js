import chalk from 'chalk';
import { deal } from '../libs/bakxml/deal';

const command = async (args) => {

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 2) {
    console.log(chalk.redBright('必须传入不改名的control!'));
    return;
  }
  const [_, control] = args['_'];
  await deal(control);
};

export { command };
