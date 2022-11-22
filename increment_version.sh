#!/bin/sh
echo 'Incrementing versions: {perfanalyzer/package.json &  perfanalyzer/vss-extension.json}'

IFS=.
PACKAGE_JSON_VERSION='';
VSS_EXTENSION_JSON_VERSION='';

re="\"(version)\": \"([^\"]*)\"";

# Set version change type to default to patch (2=patch, 1=minor, 0=major)
VERSION_CHANGE_TYPE=2;

# Reading current version.
while read -r l; do
    if [[ $l =~ $re ]]; then
        value="${BASH_REMATCH[2]}";
        VSS_EXTENSION_JSON_VERSION="$value";
    fi
done < vss-extension.json;

#Splitting Current version
read -ra arr <<< "$VSS_EXTENSION_JSON_VERSION"

echo  'Current Version' $VSS_EXTENSION_JSON_VERSION;

#Variables
i=0;
FINAL_VERSION_CONCAT=''
j=''

#Default Version
MAJOR_VERION='';
MINOR_VERION='';
PATCH_VERION='';
FINAL_VERSION_CONCAT=''

# Print each value of the array by using the loop
for val in "${arr[@]}";
do
  if  (( $VERSION_CHANGE_TYPE == $i )); then
    j=$((val+1))
  else 
    j=$((val))
  fi

  if ((0 == $i)); then
    MAJOR_VERION=$j
  elif ((1 == $i)); then
    MINOR_VERION=$j
  elif  (( 2 == $i )); then
    PATCH_VERION=$j
  else 
    echo 'Excepton';
  fi
  i=$((i+1))
done

FINAL_VERSION_CONCAT="$MAJOR_VERION.$MINOR_VERION.$PATCH_VERION"
echo "Updated Version: $FINAL_VERSION_CONCAT";

json -I -f vss-extension.json -e "this.version='$FINAL_VERSION_CONCAT'"

cd perfanalyzer
json -I -f package.json -e "this.version='$FINAL_VERSION_CONCAT'"

json -I -f task.json -e "this.version.Major=$MAJOR_VERION"
json -I -f task.json -e "this.version.Minor=$MINOR_VERION"
json -I -f task.json -e "this.version.Patch=$PATCH_VERION"
