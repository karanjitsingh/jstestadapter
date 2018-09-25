### JSTestAdapter [![Build Status](https://karanjitsingh.visualstudio.com/JSTestAdapter/_apis/build/status/karanjitsingh.JSTestAdapter)](https://karanjitsingh.visualstudio.com/JSTestAdapter/_build/latest?definitionId=4)

JSTestAdapter is a JavaScript test adapter extension for [Visual Studio Test Platform](https://github.com/Microsoft/vstest). JSTestAdapter with vstest can be used as a command line tool to run tests written in mocha, jasmine or jest.

### Install
```bash
npm install --save-dev jstestadapter
```

### Usage
```bash
# Testing with default test framework, Jasmine
path/to/vstest.console.exe --Inisolation --TestAdapterPath:./node_modules/jstestadapter/ path/to/test.1.js path/to/test.2.js

# Testing with Mocha
path/to/vstest.console.exe --Inisolation --TestAdapterPath:./node_modules/jstestadapter/ path/to/test.1.js path/to/test.2.js -- JSTest.TestFramework=Mocha

# Running tests with jest
path/to/vstest.console.exe --Inisolation --TestAdapterPath:./node_modules/jstestadapter/ path/to/package.json -- JSTest.TestFramework=Jest
```



Due to a current bug in vstest the switch `--Inisolation` is required to run JSTestAdapter.

### RunSettings Configuration

Option |  Usage  | Default
------ | ------- | --------
TestFramework | One of the following test frameworks for execution: Jasmine/Mocha/Jest | Jasmine
DebugLogs | Enable debug logs for JavaScript test runner | false
TestFrameworkConfigJson | Override test framework configurations (Specific to the testframework) in json format | {} 

#### RunSettings can be provided through the the vstest cli itself:
```bash
vstest.console.exe --Isolation --TestAdapterPath:<path> <files> -- JSTest.DebugLogs=true JSTest.TestFramework=mocha
```

#### Using RunSettings xml defined for vstest:
```bash
vstest.console.exe --Isolation --Settings:RunSettings.xml --TestAdapterPath:<path> <files>
```
With RunSettings.xml:
```xml
<RunSettings>
    <JSTest>
        <TestFramework>mocha</TestFramework>
        <TestFrameworkConfigJson>{
            "timeout": 60000,
            "slow": 30000
        }</TestFrameworkConfigJson>
        <DebugLogs>true</DebugLogs>
    </JSTest>
</RunSettings>
```
