import chalk from 'chalk';
import { deal } from '../libs/push/deal';

const command = async (args) => {

  console.log(chalk.bgGreenBright("args"), args);
  
  if (args['_'].length < 3) {
    console.log(chalk.redBright('必须传入prefix, control!'));
    return;
  }
  const [_, prefix, control] = args['_'];
  await deal(prefix, control, args.isglobal);
};

export { command };
