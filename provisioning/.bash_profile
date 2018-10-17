#PS1='\[`[ $? = 0 ] && X=2 || X=1; tput setaf $X`\]\h\[`tput sgr0`\]:$PWD\n\$ '
PS1="\[\`if [[ \$? = "0" ]]; then echo '\e[32m\h\e[0m'; else echo '\e[31m\h\e[0m' ; fi\`:\$PWD\n\$ "
#PS1="\[\`if [[ \$? = "0" ]]; then echo '\e[32m\h\e[0m'; else echo '\e[31m\h\e[0m' ; fi\`:\w\n\$ "
export CLICOLOR=1
export LSCOLORS=GxFxCxDxBxegedabagaced
alias a='cat ~/.bash_profile'
alias ls='ls -la'
alias sb='cd /Users/brendan/sandbox'
alias bp='vim ~/.bash_profile'
if [ -f ~/.bashrc ]; then
	    alias bp-reload='source ~/.bashrc'
	        echo 'reloading from .bashrc'
	else
		    alias bp-reload='source ~/.bash_profile'
		        echo 'reloading from .bash_profile'
		fi
		alias gp='git pull'
		alias push='git push'
		alias gaa='git add .'
		alias gc="git commit -m'"
		alias v='cd /vagrant'
		#if [ -f `brew --prefix`/etc/bash_completion ]; then
		#	    . `brew --prefix`/etc/bash_completion
		#fi
		#source ~/.git-prompt.sh
		#source ~/git-flow-completion.bash

