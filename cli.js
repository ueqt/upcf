import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import yargsParser from 'yargs-parser';

const main = async () => {

  clear();

  console.log(chalk.yellow(figlet.textSync('UPCF', { horizontalLayout: 'full' })));

  const args = yargsParser(process.argv.slice(2));
  // console.log(args);

  if (args['_'].length <= 0) {
    console.log(chalk.red('Please input command'));
    return;
  }

  const command = args['_'][0];
  const realCommand = await import(`./commands/${command}.js`);
  if (!realCommand) {
    console.log(chalk.red(`Not found command: ${command}`));
    return;
  }
  await realCommand.command(args);
}

main();
