#!/bin/bash

fn=$(printf '%q' "$1")

if [ "$fn" == "" ]
    then
        echo -e "\e[01;31merror: parameter required\e[0m"
        exit 1
fi

eval fn="$fn" #expands ~/ to /home/owner/

if [ -d "$fn" ]
    then
        echo -e "\e[01;31merror: parameter "$fn" is a directory\e[0m"
        exit 1
fi

echo -e "\e[01;92mrmd5ing:\e[0m $fn ..."

# Get md5
md5=`md5sum "$fn" | cut -d' ' -f1`
echo -e "\e[01;92mmd5:\e[0m     $md5"

if [ -f "$fn.md5" ]
    then
        echo -e "\e[01;31merror: "$fn.md5" already exists\e[0m"
        exit 1
fi

# Create md5 file
echo $md5 > "$fn.md5"
echo -e "\e[01;92mcreated:\e[0m $fn.md5"

# Zero file
#`echo > "$fn"`
`truncate -s 0 "$fn"`

if [ ! -f "$fn.md5" ]
    then
        echo -e "\e[01;31merror: could not zero "$fn"\e[0m"
        exit 1
fi

echo -e "\e[01;92mzeroed:\e[0m  $fn"
echo -e "\e[01;92mdone.\e[0m"

