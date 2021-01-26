#!/usr/bin/env bash

# Requires the AWS CLI and a valid AWS API key in default config or environment

# The full-texts S3 bucket, assumed to have one .txt file per hymn named in 001.txt convention
S3_BUCKET=osh-ce-full-texts

# The following syntax to pad numbers with leading zeroes requires bash-4 or greater
for n in {001..502}; do
  aws s3 cp s3://${S3_BUCKET}/"$n".txt db/texts/"$n".txt ;
done