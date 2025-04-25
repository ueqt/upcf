import chalk from 'chalk';
import { deal } from '../libs/start/deal';

const command = async (args) => {

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 2) {
    console.log(chalk.redBright('必须传入control!'));
    return;
  }
  const [_, control] = args['_'];
  console.log(`control: ${control}`);
  await deal(control, args.isglobal);
};

export { command };
