@echo off
rem next if is used to not close the window in case of error
if not defined in_subprocess (cmd /k set in_subprocess=y ^& %0 %*) & exit )

echo Eslinting src/*.js
call npx eslint --fix src/*.js

echo Eslinting poser/*.js
call npx eslint --fix poser/*.js
call npx eslint --fix poser/*.html

echo Eslinting examples/*.js
call npx eslint --fix examples/*.js

pause
exit

