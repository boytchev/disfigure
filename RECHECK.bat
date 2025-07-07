@echo off
rem next if is used to not close the window in case of error
if not defined in_subprocess (cmd /k set in_subprocess=y ^& %0 %*) & exit )

echo Eslinting src/*.js
call npx eslint --fix src/*.js
echo Eslinting src/poser/*.js
call npx eslint --fix src/poser/*.js
echo Eslinting src/poser/*.html
call npx eslint --fix src/poser/*.html

pause
exit

