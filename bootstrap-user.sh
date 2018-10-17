#!/usr/bin/env bash
cd /vagrant
composer config github-oauth.github.com 1995ed5297b782dab5ba6aeb448389f9b0f20da5
git config --global user.name "Dan"
git config --global user.email "dan@alipes.com"
git config --global core.editor "vim"
git config --global color.branch auto
git config --global color.diff auto
git config --global color.interactive auto
git config --global color.status auto
