# upcf
ueqt common pcf library

## Usage

### Schema

```zsh
# 全量生成
upcf schema ts <tablelogicalname1> <tablelogicalname2> --path "./"
upcf schema cs <tablelogicalname1> <tablelogicalname2> --path "./"
# 根据文件使用到的生成
upcf schema ts <tablelogicalname1> <tablelogicalname2> --path "./" --clean
upcf schema cs <tablelogicalname1> <tablelogicalname2> --path "./" --clean
```

## Installation pacx

```zsh
dotnet tool install -g Greg.Xrm.Command
pacx auth create -n "philips-dev" -cs "AuthType=ClientSecret;url=https://contosotest.crm.dynamics.com;ClientId={AppId};ClientSecret={ClientSecret}"
```

### webresource

```zsh
mkdir ./webresources
pacx wr init -r -s my_solution_name -f ./webresources
cd ./webresources
pacx wr push -p myjs -s my_solution_name  
```