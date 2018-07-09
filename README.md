### JSTestAdapter

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

#### TODO
- [ ] Release branches
- [ ] Discovery improvements
- [ ] More Unit Tests
- [ ] Trace Statements
- [ ] Acceptance Tests:
    - [ ] Should report if error
        - [ ] Before `describe`
        - [ ] In `describe`
        - [ ] In `before`
        - [ ] In `it`
    - [ ] For each supported framework