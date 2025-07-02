@ECHO OFF


CALL npm run build


@echo
@echo

@dir dist\*.js

pause
