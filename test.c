// 冒泡排序
// 1. 遍历数组，比较相邻元素，如果元素不相等，则交换它们的位置。
// 2. 重复步骤1，直到没有需要交换的元素为止。

#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = )} else {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp}}} else {
        printf("数组已经有序。\n");
    }


int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
}
